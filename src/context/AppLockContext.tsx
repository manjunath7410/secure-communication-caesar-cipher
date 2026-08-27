/**
 * @file AppLockContext.tsx
 * @description Global React Context for App Lock state and actions.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppLockSettings, BiometricAvailability } from '../types/appLock';
import { appLockService } from '../services/appLockService';
import { BiometricService } from '../services/biometricService';
import { SecureStorageService } from '../services/secureStorageService';
import { useAuth } from '../hooks/useAuth';

interface AppLockContextType {
  isLocked: boolean;
  settings: AppLockSettings;
  biometricAvailability: BiometricAvailability;
  lockoutSecondsLeft: number;
  lockNow: () => void;
  unlockWithPin: (pin: string) => Promise<{ success: boolean; error?: string; lockoutSeconds?: number }>;
  unlockWithBiometrics: () => Promise<{ success: boolean; error?: string; cancelled?: boolean }>;
  setPin: (pin: string) => Promise<void>;
  changePin: (currentPin: string, newPin: string) => Promise<boolean>;
  disableAppLock: (pin?: string) => Promise<boolean>;
  updateSettings: (partial: Partial<AppLockSettings>) => void;
  secureCopyToClipboard: (text: string, onToast?: (title: string, msg: string) => void) => Promise<void>;
  refreshBiometrics: () => Promise<void>;
}

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

export const AppLockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isLocked, setIsLocked] = useState<boolean>(() => appLockService.getIsLocked());
  const [settings, setSettings] = useState<AppLockSettings>(() => appLockService.getSettings());
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState<number>(0);
  const [biometricAvailability, setBiometricAvailability] = useState<BiometricAvailability>({
    isAvailable: false,
    hasEnrolledBiometrics: false,
    biometryType: 'none',
    platform: 'web',
  });

  // Check biometric availability
  const checkBiometrics = useCallback(async () => {
    try {
      const avail = await BiometricService.checkAvailability();
      setBiometricAvailability(avail);
    } catch {
      setBiometricAvailability({
        isAvailable: false,
        hasEnrolledBiometrics: false,
        biometryType: 'none',
        platform: 'web',
      });
    }
  }, []);

  // Initialize service on mount & auth change
  useEffect(() => {
    appLockService.init(isAuthenticated);
    checkBiometrics();

    const unsubscribe = appLockService.subscribe((locked) => {
      setIsLocked(locked);
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, checkBiometrics]);

  // Lockout cooldown countdown timer
  useEffect(() => {
    const checkCooldown = () => {
      const lockoutUntil = SecureStorageService.getLockoutUntil();
      if (lockoutUntil) {
        const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
        setLockoutSecondsLeft(remaining);
      } else {
        setLockoutSecondsLeft(0);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const lockNow = useCallback(() => {
    appLockService.lockNow();
  }, []);

  const unlockWithPin = useCallback(async (pin: string) => {
    const result = await appLockService.unlockWithPin(pin);
    if (result.lockoutSeconds) {
      setLockoutSecondsLeft(result.lockoutSeconds);
    }
    return result;
  }, []);

  const unlockWithBiometrics = useCallback(async () => {
    return await appLockService.unlockWithBiometrics();
  }, []);

  const setPin = useCallback(async (pin: string) => {
    await appLockService.setPin(pin);
    setSettings(appLockService.getSettings());
  }, []);

  const changePin = useCallback(async (currentPin: string, newPin: string) => {
    const success = await appLockService.changePin(currentPin, newPin);
    if (success) {
      setSettings(appLockService.getSettings());
    }
    return success;
  }, []);

  const disableAppLock = useCallback(async (pin?: string) => {
    const success = await appLockService.disableAppLock(pin);
    if (success) {
      setSettings(appLockService.getSettings());
    }
    return success;
  }, []);

  const updateSettings = useCallback((partial: Partial<AppLockSettings>) => {
    const updated = appLockService.updateSettings(partial);
    setSettings(updated);
  }, []);

  const secureCopyToClipboard = useCallback(async (text: string, onToast?: (title: string, msg: string) => void) => {
    await appLockService.secureCopyToClipboard(text, onToast);
  }, []);

  return (
    <AppLockContext.Provider
      value={{
        isLocked,
        settings,
        biometricAvailability,
        lockoutSecondsLeft,
        lockNow,
        unlockWithPin,
        unlockWithBiometrics,
        setPin,
        changePin,
        disableAppLock,
        updateSettings,
        secureCopyToClipboard,
        refreshBiometrics: checkBiometrics,
      }}
    >
      {children}
    </AppLockContext.Provider>
  );
};

export const useAppLock = (): AppLockContextType => {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
};
