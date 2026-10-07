/**
 * @file appLockService.ts
 * @description Centralized App Lock lifecycle & state manager.
 * Coordinates PIN verification, biometrics, auto-lock timers, background detection,
 * and secure screen privacy.
 */

import { App as CapApp } from '@capacitor/app';
import { Clipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';
import { AppLockSettings, AutoLockTimeout, BiometricAvailability } from '../types/appLock';
import { SecureStorageService } from './secureStorageService';
import { BiometricService } from './biometricService';

type LockStateListener = (isLocked: boolean) => void;

export class AppLockService {
  private static instance: AppLockService;
  private isLocked: boolean = false;
  private lastActivityTime: number = Date.now();
  private listeners: Set<LockStateListener> = new Set();
  private autoLockInterval: any = null;
  private isInitialized: boolean = false;
  private clipboardClearTimer: any = null;

  private constructor() {}

  public static getInstance(): AppLockService {
    if (!AppLockService.instance) {
      AppLockService.instance = new AppLockService();
    }
    return AppLockService.instance;
  }

  /**
   * Initialize AppLock service and lifecycle listeners
   */
  public async init(isAuthenticated: boolean): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const settings = this.getSettings();

    // If app lock is enabled and user is authenticated, lock upon launch
    if (settings.enabled && settings.pinConfigured && isAuthenticated) {
      this.isLocked = true;
    }

    // Apply FLAG_SECURE on Android if enabled
    if (settings.enabled && settings.preventScreenshots) {
      BiometricService.setFlagSecure(true).catch(() => {});
    }

    // 1. Setup auto-lock interval checker (every 5 seconds)
    if (typeof window !== 'undefined') {
      this.autoLockInterval = setInterval(() => {
        this.checkAutoLock();
      }, 5000);

      // Track user interaction to keep lastActivityTime fresh
      const recordUserActivity = () => {
        if (!this.isLocked) {
          this.lastActivityTime = Date.now();
        }
      };

      window.addEventListener('mousedown', recordUserActivity, { passive: true });
      window.addEventListener('keydown', recordUserActivity, { passive: true });
      window.addEventListener('touchstart', recordUserActivity, { passive: true });

      // 2. Web Visibility Change Listener (tab switch / window minimize)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.handleAppBackground();
        } else if (document.visibilityState === 'visible') {
          this.handleAppForeground();
        }
      });
    }

    // 3. Native Capacitor App State Listener
    if (Capacitor.isPluginAvailable('App')) {
      CapApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          this.handleAppBackground();
        } else {
          this.handleAppForeground();
        }
      });
    }
  }

  /**
   * Called when app enters background
   */
  public handleAppBackground(): void {
    const settings = this.getSettings();
    if (!settings.enabled || !settings.pinConfigured) return;

    SecureStorageService.recordBackgroundTime(Date.now());

    if (settings.autoLockTimeout === 'immediately' || settings.lockOnBackground) {
      this.lock();
    }
  }

  /**
   * Called when app returns to foreground
   */
  public handleAppForeground(): void {
    const settings = this.getSettings();
    if (!settings.enabled || !settings.pinConfigured) return;

    const bgTime = SecureStorageService.getLastBackgroundTime();
    SecureStorageService.clearBackgroundTime();

    if (bgTime) {
      const elapsedMs = Date.now() - bgTime;
      const timeoutMs = this.getTimeoutMilliseconds(settings.autoLockTimeout);

      if (timeoutMs !== null && elapsedMs >= timeoutMs) {
        this.lock();
      }
    }
  }

  /**
   * Evaluate periodic auto-lock based on inactivity
   */
  public checkAutoLock(): void {
    const settings = this.getSettings();
    if (!settings.enabled || !settings.pinConfigured || this.isLocked) return;

    const timeoutMs = this.getTimeoutMilliseconds(settings.autoLockTimeout);
    if (timeoutMs === null) return; // 'never'

    const idleTime = Date.now() - this.lastActivityTime;
    if (idleTime >= timeoutMs) {
      this.lock();
    }
  }

  /**
   * Parse AutoLock timeout string to milliseconds
   */
  public getTimeoutMilliseconds(timeout: AutoLockTimeout): number | null {
    switch (timeout) {
      case 'immediately':
        return 0;
      case '1min':
        return 1 * 60 * 1000;
      case '5min':
        return 5 * 60 * 1000;
      case '15min':
        return 15 * 60 * 1000;
      case 'never':
        return null;
      default:
        return 5 * 60 * 1000;
    }
  }

  /**
   * Lock the application immediately
   */
  public lock(): void {
    const settings = this.getSettings();
    if (!settings.enabled || !settings.pinConfigured) return;

    if (!this.isLocked) {
      this.isLocked = true;
      this.notifyListeners();
    }
  }

  /**
   * Force lock now regardless of timers
   */
  public lockNow(): void {
    this.isLocked = true;
    this.notifyListeners();
  }

  /**
   * Attempt unlock with 6-digit PIN
   */
  public async unlockWithPin(pin: string): Promise<{ success: boolean; error?: string; lockoutSeconds?: number }> {
    // Check if currently locked out
    const lockoutUntil = SecureStorageService.getLockoutUntil();
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
      return {
        success: false,
        error: `Too many incorrect attempts. Try again in ${remainingSeconds} seconds.`,
        lockoutSeconds: remainingSeconds,
      };
    }

    const isValid = await SecureStorageService.verifyPin(pin);

    if (isValid) {
      SecureStorageService.resetFailedAttempts();
      this.isLocked = false;
      this.lastActivityTime = Date.now();
      this.notifyListeners();
      return { success: true };
    } else {
      const { failedAttempts, lockoutSeconds } = SecureStorageService.recordFailedAttempt();
      let errorMsg = 'Incorrect PIN. Please try again.';
      if (lockoutSeconds > 0) {
        errorMsg = `Too many incorrect attempts (${failedAttempts}). Try again in ${lockoutSeconds} seconds.`;
      }
      return {
        success: false,
        error: errorMsg,
        lockoutSeconds: lockoutSeconds > 0 ? lockoutSeconds : undefined,
      };
    }
  }

  /**
   * Attempt unlock with device biometrics
   */
  public async unlockWithBiometrics(): Promise<{ success: boolean; error?: string; cancelled?: boolean }> {
    const settings = this.getSettings();
    if (!settings.biometricsEnabled) {
      return { success: false, error: 'Biometric unlock is disabled in settings.' };
    }

    const result = await BiometricService.authenticate();
    if (result.success) {
      SecureStorageService.resetFailedAttempts();
      this.isLocked = false;
      this.lastActivityTime = Date.now();
      this.notifyListeners();
      return { success: true };
    }

    return {
      success: false,
      error: result.error || 'Biometric authentication failed.',
      cancelled: result.cancelled,
    };
  }

  /**
   * Set or update App PIN
   */
  public async setPin(newPin: string): Promise<void> {
    await SecureStorageService.savePin(newPin);
    const settings = this.getSettings();
    this.updateSettings({ ...settings, enabled: true, pinConfigured: true });
    this.isLocked = false;
    this.notifyListeners();
  }

  /**
   * Recover & Reset PIN bypassing current PIN (after identity verification)
   */
  public async recoverAndResetPin(newPin: string): Promise<void> {
    SecureStorageService.clearLockout();
    await SecureStorageService.savePin(newPin);
    const settings = this.getSettings();
    this.updateSettings({ ...settings, enabled: true, pinConfigured: true });
    this.isLocked = false;
    this.lastActivityTime = Date.now();
    this.notifyListeners();
  }

  /**
   * Emergency unlock and clear lockout
   */
  public unlockAndClearLockout(): void {
    SecureStorageService.clearLockout();
    this.isLocked = false;
    this.lastActivityTime = Date.now();
    this.notifyListeners();
  }

  /**
   * Change existing PIN after verifying current PIN
   */
  public async changePin(currentPin: string, newPin: string): Promise<boolean> {
    const isValid = await SecureStorageService.verifyPin(currentPin);
    if (!isValid) {
      return false;
    }
    await SecureStorageService.savePin(newPin);
    return true;
  }

  /**
   * Disable App Lock after verification
   */
  public async disableAppLock(verificationPin?: string): Promise<boolean> {
    if (verificationPin) {
      const isValid = await SecureStorageService.verifyPin(verificationPin);
      if (!isValid) return false;
    }
    SecureStorageService.removePin();
    this.isLocked = false;
    BiometricService.setFlagSecure(false).catch(() => {});
    this.notifyListeners();
    return true;
  }

  /**
   * Update settings
   */
  public updateSettings(partial: Partial<AppLockSettings>): AppLockSettings {
    const updated = SecureStorageService.saveSettings(partial);
    if (updated.enabled && updated.preventScreenshots) {
      BiometricService.setFlagSecure(true).catch(() => {});
    } else {
      BiometricService.setFlagSecure(false).catch(() => {});
    }
    return updated;
  }

  /**
   * Get current settings
   */
  public getSettings(): AppLockSettings {
    return SecureStorageService.getSettings();
  }

  /**
   * Get Lock state
   */
  public getIsLocked(): boolean {
    return this.isLocked;
  }

  /**
   * Subscribe to lock state changes
   */
  public subscribe(listener: LockStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.isLocked));
  }

  /**
   * Clipboard security helper: Copy to clipboard and auto-clear after timeout if enabled
   */
  public async secureCopyToClipboard(text: string, onToast?: (title: string, msg: string) => void): Promise<void> {
    const settings = this.getSettings();

    try {
      if (Capacitor.isPluginAvailable('Clipboard')) {
        await Clipboard.write({ string: text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // Fallback
    }

    if (settings.clearClipboardOnCopy) {
      if (this.clipboardClearTimer) {
        clearTimeout(this.clipboardClearTimer);
      }

      const timeoutMs = (settings.clipboardTimeoutSeconds || 60) * 1000;
      this.clipboardClearTimer = setTimeout(async () => {
        try {
          if (Capacitor.isPluginAvailable('Clipboard')) {
            await Clipboard.write({ string: '' });
          } else if (navigator.clipboard) {
            await navigator.clipboard.writeText('');
          }
          if (onToast) {
            onToast('Clipboard Cleared', 'Copied message was automatically removed from clipboard for privacy.');
          }
        } catch {
          // Ignore
        }
      }, timeoutMs);
    }
  }
}

export const appLockService = AppLockService.getInstance();
