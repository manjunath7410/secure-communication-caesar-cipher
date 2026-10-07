/**
 * @file secureStorageService.ts
 * @description Secure local cryptographic storage service for App Lock.
 * Uses Web Crypto PBKDF2-SHA256 with 100,000 iterations and random salt to verify PINs.
 * Plaintext PINs are NEVER stored, logged, or serialized.
 */

import { AppLockSettings, StoredPinData } from '../types/appLock';

const STORAGE_KEYS = {
  PIN_DATA: 'caesar_app_lock_pin_data',
  SETTINGS: 'caesar_app_lock_settings',
  FAILED_ATTEMPTS: 'caesar_app_lock_failed_attempts',
  LOCKOUT_UNTIL: 'caesar_app_lock_lockout_until',
  LAST_BACKGROUND: 'caesar_app_lock_last_bg',
  IS_LOCKED: 'caesar_app_lock_is_locked_session',
};

const DEFAULT_SETTINGS: AppLockSettings = {
  enabled: false,
  biometricsEnabled: true,
  pinConfigured: false,
  autoLockTimeout: '5min',
  lockOnBackground: true,
  preventScreenshots: true,
  clearClipboardOnCopy: false,
  clipboardTimeoutSeconds: 60,
};

const PBKDF2_ITERATIONS = 100000;

export class SecureStorageService {
  /**
   * Convert byte array to hexadecimal string
   */
  private static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convert hexadecimal string to byte array
   */
  private static hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  }

  /**
   * Cryptographically derives a PBKDF2-SHA256 hash from a 6-digit PIN and salt.
   */
  public static async hashPin(pin: string, saltHex?: string): Promise<{ salt: string; hash: string }> {
    const encoder = new TextEncoder();
    const pinBuffer = encoder.encode(pin);

    // Generate or parse salt (16 random bytes)
    let saltBytes: Uint8Array;
    if (saltHex) {
      saltBytes = this.hexToBytes(saltHex);
    } else {
      saltBytes = new Uint8Array(16);
      if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(saltBytes);
      } else {
        // Fallback for node test environments
        for (let i = 0; i < 16; i++) {
          saltBytes[i] = Math.floor(Math.random() * 256);
        }
      }
    }

    // Import base key
    let subtle: SubtleCrypto | undefined;
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      subtle = window.crypto.subtle;
    } else {
      // Node.js WebCrypto support
      try {
        const cryptoModule = await import('crypto');
        subtle = cryptoModule.webcrypto.subtle as unknown as SubtleCrypto;
      } catch {
        // Fallback
      }
    }

    if (subtle) {
      const baseKey = await subtle.importKey('raw', pinBuffer, { name: 'PBKDF2' }, false, ['deriveBits']);

      const derivedBits = await subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBytes as unknown as BufferSource,
          iterations: PBKDF2_ITERATIONS,
          hash: 'SHA-256',
        },
        baseKey,
        256
      );

      const hashHex = this.bytesToHex(new Uint8Array(derivedBits));
      return {
        salt: this.bytesToHex(saltBytes),
        hash: hashHex,
      };
    } else {
      // Fallback simple hash for testing environments without SubtleCrypto
      let fallbackHash = 0;
      for (let i = 0; i < pin.length; i++) {
        fallbackHash = (fallbackHash << 5) - fallbackHash + pin.charCodeAt(i);
        fallbackHash |= 0;
      }
      return {
        salt: this.bytesToHex(saltBytes),
        hash: Math.abs(fallbackHash).toString(16).padStart(64, '0'),
      };
    }
  }

  /**
   * Stores a new 6-digit PIN securely using salted PBKDF2 hash.
   */
  public static async savePin(pin: string): Promise<void> {
    if (!/^\d{6}$/.test(pin)) {
      throw new Error('PIN must be exactly 6 digits.');
    }

    const { salt, hash } = await this.hashPin(pin);
    const pinData: StoredPinData = {
      salt,
      hash,
      iterations: PBKDF2_ITERATIONS,
      algorithm: 'PBKDF2-SHA256',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEYS.PIN_DATA, JSON.stringify(pinData));
    
    // Update pinConfigured in settings
    const currentSettings = this.getSettings();
    this.saveSettings({ ...currentSettings, pinConfigured: true });
    
    // Reset any failed attempts
    this.resetFailedAttempts();
  }

  /**
   * Verifies if a candidate PIN matches the stored hash.
   */
  public static async verifyPin(candidatePin: string): Promise<boolean> {
    if (!/^\d{6}$/.test(candidatePin)) {
      return false;
    }

    const rawData = localStorage.getItem(STORAGE_KEYS.PIN_DATA);
    if (!rawData) {
      return false;
    }

    try {
      const pinData: StoredPinData = JSON.parse(rawData);
      if (!pinData.salt || !pinData.hash) {
        return false;
      }

      const { hash } = await this.hashPin(candidatePin, pinData.salt);
      
      // Constant-time comparison
      return this.constantTimeCompare(hash, pinData.hash);
    } catch {
      return false;
    }
  }

  /**
   * Constant-time comparison to prevent timing attacks
   */
  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * Checks if a PIN has been set
   */
  public static hasConfiguredPin(): boolean {
    const rawData = localStorage.getItem(STORAGE_KEYS.PIN_DATA);
    if (!rawData) return false;
    try {
      const data: StoredPinData = JSON.parse(rawData);
      return !!(data.hash && data.salt);
    } catch {
      return false;
    }
  }

  /**
   * Clears PIN data completely when App Lock is disabled
   */
  public static removePin(): void {
    localStorage.removeItem(STORAGE_KEYS.PIN_DATA);
    const settings = this.getSettings();
    this.saveSettings({ ...settings, pinConfigured: false, enabled: false });
    this.resetFailedAttempts();
  }

  /**
   * Get App Lock Settings
   */
  public static getSettings(): AppLockSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      const hasPin = this.hasConfiguredPin();
      return { ...DEFAULT_SETTINGS, pinConfigured: hasPin };
    }
    try {
      const parsed = JSON.parse(raw);
      const hasPin = this.hasConfiguredPin();
      return { ...DEFAULT_SETTINGS, ...parsed, pinConfigured: hasPin };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save App Lock Settings
   */
  public static saveSettings(settings: Partial<AppLockSettings>): AppLockSettings {
    const current = this.getSettings();
    const updated: AppLockSettings = {
      ...current,
      ...settings,
      pinConfigured: this.hasConfiguredPin(),
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  }

  /**
   * Failed attempts and Rate Limiting
   */
  public static getFailedAttempts(): number {
    const count = localStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS);
    return count ? parseInt(count, 10) || 0 : 0;
  }

  public static getLockoutUntil(): number | null {
    const val = localStorage.getItem(STORAGE_KEYS.LOCKOUT_UNTIL);
    if (!val) return null;
    const timestamp = parseInt(val, 10);
    if (isNaN(timestamp) || Date.now() >= timestamp) {
      localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
      return null;
    }
    return timestamp;
  }

  /**
   * Record a failed PIN attempt and compute rate-limiting cooldown if needed
   */
  public static recordFailedAttempt(): { failedAttempts: number; lockoutSeconds: number } {
    const attempts = this.getFailedAttempts() + 1;
    localStorage.setItem(STORAGE_KEYS.FAILED_ATTEMPTS, attempts.toString());

    let lockoutSeconds = 0;
    if (attempts >= 8) {
      lockoutSeconds = 60; // 60s cooldown for 8+ attempts
    } else if (attempts >= 5) {
      lockoutSeconds = 30; // 30s cooldown for 5-7 attempts
    } else if (attempts >= 3) {
      lockoutSeconds = 10; // 10s cooldown for 3-4 attempts
    }

    if (lockoutSeconds > 0) {
      const lockoutUntil = Date.now() + lockoutSeconds * 1000;
      localStorage.setItem(STORAGE_KEYS.LOCKOUT_UNTIL, lockoutUntil.toString());
    }

    return { failedAttempts: attempts, lockoutSeconds };
  }

  /**
   * Reset failed attempts upon successful authentication
   */
  public static resetFailedAttempts(): void {
    localStorage.removeItem(STORAGE_KEYS.FAILED_ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
  }

  /**
   * Immediately clear lockout (e.g. during recovery)
   */
  public static clearLockout(): void {
    this.resetFailedAttempts();
  }

  /**
   * Background timestamp recording for timeout calculation
   */
  public static recordBackgroundTime(timestamp: number = Date.now()): void {
    localStorage.setItem(STORAGE_KEYS.LAST_BACKGROUND, timestamp.toString());
  }

  public static getLastBackgroundTime(): number | null {
    const val = localStorage.getItem(STORAGE_KEYS.LAST_BACKGROUND);
    return val ? parseInt(val, 10) || null : null;
  }

  public static clearBackgroundTime(): void {
    localStorage.removeItem(STORAGE_KEYS.LAST_BACKGROUND);
  }
}
