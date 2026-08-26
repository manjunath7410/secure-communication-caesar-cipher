/**
 * @file appLock.ts
 * @description Type definitions for the application lock, biometric authentication, and local security.
 */

export type AutoLockTimeout = 'immediately' | '1min' | '5min' | '15min' | 'never';

export interface AppLockSettings {
  enabled: boolean;
  biometricsEnabled: boolean;
  pinConfigured: boolean;
  autoLockTimeout: AutoLockTimeout;
  lockOnBackground: boolean;
  preventScreenshots: boolean;
  clearClipboardOnCopy: boolean;
  clipboardTimeoutSeconds: number;
}

export type BiometryType = 'fingerprint' | 'face' | 'biometrics' | 'webauthn' | 'none';

export interface BiometricAvailability {
  isAvailable: boolean;
  hasEnrolledBiometrics: boolean;
  biometryType: BiometryType;
  statusReason?: string;
  platform: 'android' | 'web' | 'ios';
}

export interface AppLockState {
  isLocked: boolean;
  isConfigured: boolean;
  failedAttempts: number;
  lockoutUntil: number | null; // timestamp in ms
  lastActiveTimestamp: number;
  lastBackgroundTimestamp: number | null;
}

export interface StoredPinData {
  salt: string; // Hex salt
  hash: string; // PBKDF2 / SHA-256 derived hash hex
  iterations: number;
  algorithm: string;
  createdAt: number;
  updatedAt: number;
}
