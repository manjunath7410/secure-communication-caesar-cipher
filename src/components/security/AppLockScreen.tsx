/**
 * @file AppLockScreen.tsx
 * @description Premium minimal App Lock screen overlay.
 * Obscures all protected application data behind a secure, accessible PIN & biometric unlock screen.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Fingerprint, KeyRound, AlertTriangle, ShieldCheck, LogOut, HelpCircle, ShieldAlert } from 'lucide-react';
import { useAppLock } from '../../context/AppLockContext';
import { useAuth } from '../../hooks/useAuth';
import { PinPad } from './PinPad';
import { Logo } from '../branding/Logo';
import { PinRecoveryModal } from './PinRecoveryModal';

export const AppLockScreen: React.FC = () => {
  const {
    isLocked,
    settings,
    biometricAvailability,
    lockoutSecondsLeft,
    unlockWithPin,
    unlockWithBiometrics,
  } = useAppLock();
  const { logout, user } = useAuth();

  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasTriggeredInitialBiometrics, setHasTriggeredInitialBiometrics] = useState<boolean>(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState<boolean>(false);

  // Clear PIN & error on lock/unlock state transitions
  useEffect(() => {
    if (isLocked) {
      setPin('');
      setErrorMessage('');
    }
  }, [isLocked]);

  // Attempt biometrics automatically on initial display if configured and available
  useEffect(() => {
    if (
      isLocked &&
      settings.biometricsEnabled &&
      biometricAvailability.isAvailable &&
      !hasTriggeredInitialBiometrics &&
      lockoutSecondsLeft === 0
    ) {
      setHasTriggeredInitialBiometrics(true);
      // Small timeout to allow mount
      const timer = setTimeout(() => {
        handleBiometricUnlock();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLocked, settings.biometricsEnabled, biometricAvailability.isAvailable, hasTriggeredInitialBiometrics, lockoutSecondsLeft]);

  // Reset initial biometric trigger flag when unlocked
  useEffect(() => {
    if (!isLocked) {
      setHasTriggeredInitialBiometrics(false);
    }
  }, [isLocked]);

  const handlePinSubmit = useCallback(
    async (submittedPin: string) => {
      if (lockoutSecondsLeft > 0 || isSubmitting) return;

      setIsSubmitting(true);
      setErrorMessage('');

      try {
        const result = await unlockWithPin(submittedPin);
        if (!result.success) {
          setErrorMessage(result.error || 'Incorrect PIN');
          setPin('');
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Verification error');
        setPin('');
      } finally {
        setIsSubmitting(false);
      }
    },
    [lockoutSecondsLeft, isSubmitting, unlockWithPin]
  );

  const handleBiometricUnlock = async () => {
    if (lockoutSecondsLeft > 0) return;
    setErrorMessage('');
    const res = await unlockWithBiometrics();
    if (!res.success && res.error && !res.cancelled) {
      setErrorMessage(res.error);
    }
  };

  const handleSignOutRecovery = () => {
    if (window.confirm('Sign out of your account? You will need your account password to sign back in.')) {
      logout();
    }
  };

  // If not locked, render nothing
  if (!isLocked) {
    return null;
  }

  const isLockedOut = lockoutSecondsLeft > 0;

  return (
    <div
      id="app-lock-overlay-screen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-lock-title"
      aria-describedby="app-lock-subtitle"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 px-4 py-8 sm:py-12 overflow-y-auto select-none transition-colors"
    >
      {/* Top Brand Header */}
      <div className="flex flex-col items-center space-y-3 pt-2">
        <Logo size="md" variant="default" showWordmark={true} id="app-lock-brand-logo" />
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Local Privacy Protected</span>
        </div>
      </div>

      {/* Center Lock Status & PIN Pad */}
      <div className="w-full max-w-sm flex flex-col items-center my-auto py-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mx-auto text-neutral-700 dark:text-neutral-300 shadow-xs">
            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 id="app-lock-title" className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            App Locked
          </h1>
          <p id="app-lock-subtitle" className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">
            {isLockedOut
              ? `Too many incorrect attempts.`
              : 'Enter your 6-digit App PIN to resume.'}
          </p>
        </div>

        {/* Lockout Warning Banner */}
        {isLockedOut && (
          <div
            id="app-lock-rate-limit-banner"
            role="alert"
            className="w-full p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5 animate-fadeIn"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-semibold block">PIN Entry Suspended</span>
              <span>Try again in {lockoutSecondsLeft}s</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && !isLockedOut && (
          <div
            id="app-lock-error-message"
            role="alert"
            className="w-full p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 text-xs text-center font-medium animate-shake"
          >
            {errorMessage}
          </div>
        )}

        {/* PIN Pad */}
        <PinPad
          pin={pin}
          onChange={setPin}
          onSubmit={handlePinSubmit}
          disabled={isLockedOut || isSubmitting}
          error={!!errorMessage && !isLockedOut}
          onClear={() => setErrorMessage('')}
          idPrefix="lock-screen"
        />

        {/* Forgot PIN / Recovery Option Button */}
        <div className="w-full flex flex-col items-center gap-2 pt-1">
          <button
            type="button"
            id="app-lock-forgot-pin-btn"
            onClick={() => setIsRecoveryModalOpen(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/70 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-2xs"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Forgot 6-Digit PIN? Recover / Change PIN</span>
          </button>
        </div>

        {/* Biometrics Trigger Button */}
        {settings.biometricsEnabled && biometricAvailability.isAvailable && !isLockedOut && (
          <button
            type="button"
            id="app-lock-biometric-trigger"
            onClick={handleBiometricUnlock}
            className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 text-xs font-medium flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-2xs active:scale-98"
          >
            <Fingerprint className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Unlock with Biometrics</span>
          </button>
        )}
      </div>

      {/* Bottom Emergency Recovery */}
      <div className="w-full max-w-sm flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60">
        <span className="text-[11px]">
          {user ? `User: ${user.username}` : 'Operator session'}
        </span>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsRecoveryModalOpen(true)}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-[11px] cursor-pointer flex items-center gap-1"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Recover PIN</span>
          </button>

          <button
            type="button"
            id="app-lock-signout-recovery"
            onClick={handleSignOutRecovery}
            className="hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer font-medium text-[11px]"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* PIN Recovery & Reset Modal */}
      <PinRecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        onSuccess={() => {
          setIsRecoveryModalOpen(false);
          setPin('');
          setErrorMessage('');
        }}
      />
    </div>
  );
};
