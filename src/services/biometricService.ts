/**
 * @file biometricService.ts
 * @description Biometric hardware authentication & screen privacy service.
 * Interfaces with native Android BiometricPrompt via Capacitor and WebAuthn on supported browsers.
 * Never fakes biometric authentication or renders fake scanners.
 */

import { Capacitor } from '@capacitor/core';
import { BiometricAvailability } from '../types/appLock';

export class BiometricService {
  private static cachedAvailability: BiometricAvailability | null = null;

  /**
   * Check biometric hardware and enrollment availability on the current device
   */
  public static async checkAvailability(): Promise<BiometricAvailability> {
    // 1. Android Native via Capacitor
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      try {
        const plugin = (Capacitor as any).Plugins?.BiometricSecurity;
        if (plugin && typeof plugin.isAvailable === 'function') {
          const result = await plugin.isAvailable();
          const availability: BiometricAvailability = {
            isAvailable: !!result.isAvailable,
            hasEnrolledBiometrics: !!result.hasEnrolledBiometrics,
            biometryType: result.biometryType || 'fingerprint',
            statusReason: result.statusReason || 'Native Android BiometricPrompt available',
            platform: 'android',
          };
          this.cachedAvailability = availability;
          return availability;
        }
      } catch (err: any) {
        return {
          isAvailable: false,
          hasEnrolledBiometrics: false,
          biometryType: 'none',
          statusReason: `Native check error: ${err?.message || 'Unavailable'}`,
          platform: 'android',
        };
      }
    }

    // 2. Web / PWA Platform Authenticator (WebAuthn / Passkeys / Windows Hello / Touch ID)
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      try {
        if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
          const isUvpaa = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          const availability: BiometricAvailability = {
            isAvailable: isUvpaa,
            hasEnrolledBiometrics: isUvpaa,
            biometryType: isUvpaa ? 'webauthn' : 'none',
            statusReason: isUvpaa
              ? 'Platform Authenticator available (WebAuthn / Passkey / Biometrics)'
              : 'No platform biometric authenticator detected on this browser/OS',
            platform: 'web',
          };
          this.cachedAvailability = availability;
          return availability;
        }
      } catch (err: any) {
        // Fallback for restricted iframes or security contexts
        return {
          isAvailable: false,
          hasEnrolledBiometrics: false,
          biometryType: 'none',
          statusReason: 'WebAuthn check restricted in current environment',
          platform: 'web',
        };
      }
    }

    return {
      isAvailable: false,
      hasEnrolledBiometrics: false,
      biometryType: 'none',
      statusReason: 'Biometric hardware unavailable on this platform',
      platform: 'web',
    };
  }

  /**
   * Request actual OS-level biometric verification.
   * Invokes native Android BiometricPrompt or browser WebAuthn prompt.
   */
  public static async authenticate(
    title: string = 'Unlock Secure Communication',
    subtitle: string = 'Verify your identity using device biometrics'
  ): Promise<{ success: boolean; error?: string; cancelled?: boolean }> {
    // 1. Android Native BiometricPrompt
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      try {
        const plugin = (Capacitor as any).Plugins?.BiometricSecurity;
        if (plugin && typeof plugin.authenticate === 'function') {
          const result = await plugin.authenticate({
            title,
            subtitle,
            cancelTitle: 'Use PIN',
          });
          return {
            success: !!result.success,
            error: result.error,
            cancelled: !!result.cancelled,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || 'Native biometric prompt failed',
        };
      }
    }

    // 2. Web WebAuthn Prompt (if supported)
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      try {
        // Generate random challenge for local unlock assertion
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        // Request local user verification
        const credential = await navigator.credentials.get({
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: 'required',
            rpId: window.location.hostname || 'localhost',
          },
        });

        if (credential) {
          return { success: true };
        }
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          return { success: false, cancelled: true, error: 'Authentication cancelled or timed out' };
        }
        return { success: false, error: err.message || 'Web biometric verification failed' };
      }
    }

    return {
      success: false,
      error: 'Biometric authentication is not supported or not configured on this device.',
    };
  }

  /**
   * Android FLAG_SECURE protection against screenshots & task switcher snapshots
   */
  public static async setFlagSecure(enabled: boolean): Promise<boolean> {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      try {
        const plugin = (Capacitor as any).Plugins?.BiometricSecurity;
        if (plugin && typeof plugin.setFlagSecure === 'function') {
          const result = await plugin.setFlagSecure({ enabled });
          return !!result.success;
        }
      } catch {
        return false;
      }
    }
    return false;
  }
}
