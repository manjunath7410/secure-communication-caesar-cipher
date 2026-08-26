/**
 * @file PinPad.tsx
 * @description Accessible 6-digit PIN pad with tactile number keys, backspace, and dot display.
 */

import React, { useEffect, useCallback } from 'react';
import { Delete, X } from 'lucide-react';

interface PinPadProps {
  pin: string;
  onChange: (pin: string) => void;
  onSubmit?: (pin: string) => void;
  maxLength?: number;
  disabled?: boolean;
  error?: boolean;
  onClear?: () => void;
  idPrefix?: string;
}

export const PinPad: React.FC<PinPadProps> = ({
  pin,
  onChange,
  onSubmit,
  maxLength = 6,
  disabled = false,
  error = false,
  onClear,
  idPrefix = 'app-lock',
}) => {
  const handleDigit = useCallback(
    (digit: string) => {
      if (disabled || pin.length >= maxLength) return;
      const nextPin = pin + digit;
      onChange(nextPin);
      if (nextPin.length === maxLength && onSubmit) {
        onSubmit(nextPin);
      }
    },
    [pin, maxLength, disabled, onChange, onSubmit]
  );

  const handleBackspace = useCallback(() => {
    if (disabled || pin.length === 0) return;
    onChange(pin.slice(0, -1));
  }, [pin, disabled, onChange]);

  const handleClearAll = useCallback(() => {
    if (disabled) return;
    onChange('');
    onClear?.();
  }, [disabled, onChange, onClear]);

  // Handle physical keyboard input
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Numbers 0-9
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        handleClearAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace, handleClearAll, disabled]);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col items-center select-none" id={`${idPrefix}-pinpad-container`}>
      {/* 6-Digit Dots Indicator */}
      <div
        className={`flex items-center justify-center gap-3.5 mb-8 transition-transform duration-200 ${
          error ? 'animate-shake' : ''
        }`}
        role="status"
        aria-live="polite"
        aria-label={`${pin.length} of ${maxLength} digits entered`}
      >
        {Array.from({ length: maxLength }).map((_, index) => {
          const filled = index < pin.length;
          return (
            <div
              key={index}
              id={`${idPrefix}-dot-${index}`}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                error
                  ? 'border-2 border-red-500 bg-red-500/20 scale-110'
                  : filled
                  ? 'bg-blue-600 dark:bg-blue-500 scale-110 shadow-xs shadow-blue-500/30'
                  : 'border-2 border-neutral-300 dark:border-neutral-700 bg-transparent'
              }`}
            />
          );
        })}
      </div>

      {/* Numerical Keypad Grid */}
      <div className="grid grid-cols-3 gap-3.5 w-full">
        {keys.map((digit) => (
          <button
            key={digit}
            type="button"
            id={`${idPrefix}-key-${digit}`}
            disabled={disabled}
            onClick={() => handleDigit(digit)}
            aria-label={`Digit ${digit}`}
            className="h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 hover:bg-neutral-200 dark:hover:bg-neutral-800 active:bg-neutral-300 dark:active:bg-neutral-700 border border-neutral-200/70 dark:border-neutral-800/80 text-xl font-semibold text-neutral-800 dark:text-neutral-100 flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            {digit}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          id={`${idPrefix}-key-clear`}
          disabled={disabled || pin.length === 0}
          onClick={handleClearAll}
          aria-label="Clear all entered digits"
          className="h-16 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-800/60 active:bg-neutral-200 dark:active:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-800/50 text-neutral-500 dark:text-neutral-400 flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 0 Button */}
        <button
          type="button"
          id={`${idPrefix}-key-0`}
          disabled={disabled}
          onClick={() => handleDigit('0')}
          aria-label="Digit 0"
          className="h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 hover:bg-neutral-200 dark:hover:bg-neutral-800 active:bg-neutral-300 dark:active:bg-neutral-700 border border-neutral-200/70 dark:border-neutral-800/80 text-xl font-semibold text-neutral-800 dark:text-neutral-100 flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          0
        </button>

        {/* Backspace Button */}
        <button
          type="button"
          id={`${idPrefix}-key-backspace`}
          disabled={disabled || pin.length === 0}
          onClick={handleBackspace}
          aria-label="Backspace delete last digit"
          className="h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 hover:bg-neutral-200 dark:hover:bg-neutral-800 active:bg-neutral-300 dark:active:bg-neutral-700 border border-neutral-200/70 dark:border-neutral-800/80 text-neutral-700 dark:text-neutral-300 flex items-center justify-center transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
