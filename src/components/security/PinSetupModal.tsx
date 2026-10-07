/**
 * @file PinSetupModal.tsx
 * @description Accessible dialog for setting, changing, and disabling App Lock PIN.
 */

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, KeyRound, AlertCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import { PinPad } from './PinPad';
import { useAppLock } from '../../context/AppLockContext';
import { PinRecoveryModal } from './PinRecoveryModal';

export type PinModalMode = 'setup' | 'change' | 'disable';

interface PinSetupModalProps {
  isOpen: boolean;
  mode: PinModalMode;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const PinSetupModal: React.FC<PinSetupModalProps> = ({
  isOpen,
  mode,
  onClose,
  onSuccess,
}) => {
  const { setPin, changePin, disableAppLock, unlockWithPin } = useAppLock();

  // Step state:
  // For 'setup': 1 (enter new) -> 2 (confirm new)
  // For 'change': 1 (enter current) -> 2 (enter new) -> 3 (confirm new)
  // For 'disable': 1 (enter current to confirm)
  const [step, setStep] = useState<number>(1);
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState<boolean>(false);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setErrorMessage('');
      setIsProcessing(false);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleStepSubmit = async (entered: string) => {
    setErrorMessage('');

    if (mode === 'setup') {
      if (step === 1) {
        setNewPin(entered);
        setConfirmPin('');
        setStep(2);
      } else if (step === 2) {
        if (entered !== newPin) {
          setErrorMessage('PINs do not match. Please try again.');
          setConfirmPin('');
          return;
        }

        setIsProcessing(true);
        try {
          await setPin(entered);
          onSuccess('App Lock has been successfully enabled with your new PIN.');
          onClose();
        } catch (err: any) {
          setErrorMessage(err?.message || 'Failed to save PIN.');
        } finally {
          setIsProcessing(false);
        }
      }
    } else if (mode === 'change') {
      if (step === 1) {
        setIsProcessing(true);
        try {
          const verifyResult = await unlockWithPin(entered);
          if (!verifyResult.success) {
            setErrorMessage('Current PIN is incorrect.');
            setCurrentPin('');
            return;
          }
          setCurrentPin(entered);
          setNewPin('');
          setStep(2);
        } catch {
          setErrorMessage('Verification failed.');
        } finally {
          setIsProcessing(false);
        }
      } else if (step === 2) {
        if (entered === currentPin) {
          setErrorMessage('New PIN must be different from current PIN.');
          setNewPin('');
          return;
        }
        setNewPin(entered);
        setConfirmPin('');
        setStep(3);
      } else if (step === 3) {
        if (entered !== newPin) {
          setErrorMessage('PINs do not match. Please try again.');
          setConfirmPin('');
          return;
        }

        setIsProcessing(true);
        try {
          const success = await changePin(currentPin, entered);
          if (success) {
            onSuccess('App PIN has been updated successfully.');
            onClose();
          } else {
            setErrorMessage('Failed to update PIN.');
          }
        } catch (err: any) {
          setErrorMessage(err?.message || 'Error changing PIN.');
        } finally {
          setIsProcessing(false);
        }
      }
    } else if (mode === 'disable') {
      setIsProcessing(true);
      try {
        const verifyResult = await unlockWithPin(entered);
        if (!verifyResult.success) {
          setErrorMessage('Incorrect PIN. App Lock could not be disabled.');
          setCurrentPin('');
          return;
        }

        const success = await disableAppLock(entered);
        if (success) {
          onSuccess('App Lock has been disabled.');
          onClose();
        } else {
          setErrorMessage('Failed to disable App Lock.');
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to disable App Lock.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const getTitle = () => {
    if (mode === 'setup') {
      return step === 1 ? 'Set 6-Digit PIN' : 'Confirm 6-Digit PIN';
    }
    if (mode === 'change') {
      if (step === 1) return 'Enter Current PIN';
      if (step === 2) return 'Enter New 6-Digit PIN';
      return 'Confirm New 6-Digit PIN';
    }
    return 'Enter Current PIN to Disable';
  };

  const getSubtitle = () => {
    if (mode === 'setup') {
      return step === 1
        ? 'Choose a memorable 6-digit PIN to secure your local session.'
        : 'Re-enter your 6-digit PIN to confirm.';
    }
    if (mode === 'change') {
      if (step === 1) return 'Verify your identity before changing your PIN.';
      if (step === 2) return 'Choose a new 6-digit PIN.';
      return 'Re-enter your new PIN to confirm.';
    }
    return 'Authentication is required to turn off App Lock protection.';
  };

  const getCurrentValue = () => {
    if (mode === 'setup') {
      return step === 1 ? newPin : confirmPin;
    }
    if (mode === 'change') {
      if (step === 1) return currentPin;
      if (step === 2) return newPin;
      return confirmPin;
    }
    return currentPin;
  };

  const handleValueChange = (val: string) => {
    setErrorMessage('');
    if (mode === 'setup') {
      if (step === 1) setNewPin(val);
      else setConfirmPin(val);
    } else if (mode === 'change') {
      if (step === 1) setCurrentPin(val);
      else if (step === 2) setNewPin(val);
      else setConfirmPin(val);
    } else {
      setCurrentPin(val);
    }
  };

  const handleBack = () => {
    setErrorMessage('');
    if (step > 1) {
      setStep(step - 1);
      if (step === 2) setNewPin('');
      if (step === 3) setConfirmPin('');
    } else {
      onClose();
    }
  };

  return (
    <div
      id="pin-setup-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none"
    >
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5 transition-colors">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              id="pin-modal-back-btn"
              onClick={handleBack}
              className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-7" />
          )}

          <div className="flex items-center gap-1">
            {mode === 'setup' && (
              <div className="flex gap-1">
                <div className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                <div className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
              </div>
            )}
            {mode === 'change' && (
              <div className="flex gap-1">
                <div className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                <div className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                <div className={`w-2 h-2 rounded-full ${step === 3 ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
              </div>
            )}
          </div>

          <button
            type="button"
            id="pin-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400 mb-2">
            <KeyRound className="w-5 h-5" />
          </div>
          <h2 id="pin-modal-title" className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {getTitle()}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {getSubtitle()}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            id="pin-modal-error"
            role="alert"
            className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 text-xs text-center font-medium animate-shake"
          >
            {errorMessage}
          </div>
        )}

        {/* PIN Pad */}
        <PinPad
          pin={getCurrentValue()}
          onChange={handleValueChange}
          onSubmit={handleStepSubmit}
          disabled={isProcessing}
          error={!!errorMessage}
          idPrefix="modal-pin"
        />

        {/* Forgot PIN Recovery Link when in Change or Disable mode */}
        {((mode === 'change' && step === 1) || mode === 'disable') && (
          <div className="pt-2 text-center">
            <button
              type="button"
              id="pin-modal-forgot-pin-btn"
              onClick={() => setIsRecoveryOpen(true)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Forgot current PIN? Recover / Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* Embedded PIN Recovery Modal */}
      <PinRecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        onSuccess={(msg) => {
          setIsRecoveryOpen(false);
          onSuccess(msg);
          onClose();
        }}
      />
    </div>
  );
};
