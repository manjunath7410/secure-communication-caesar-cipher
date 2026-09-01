import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setSelectedShift as syncActivityStoreShift } from '../services/activityStore';

export const PRIMARY_SHIFT_STORAGE_KEY = 'secure_comm_active_shift';
export const LEGACY_SHIFT_STORAGE_KEY = 'secure_comm_shift';
export const DEFAULT_CAESAR_SHIFT = 3;

/**
 * Validates and normalizes a shift value.
 * Valid shifts are strictly integers between 0 and 25 inclusive.
 * Returns null if the value cannot be parsed to a valid integer in [0, 25].
 */
export function validateAndNormalizeShift(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || Number.isNaN(num)) return null;
  if (!Number.isInteger(num)) {
    // If not integer, check if rounding produces a valid value in [0, 25]
    const rounded = Math.round(num);
    if (rounded >= 0 && rounded <= 25) return rounded;
    return null;
  }
  if (num < 0 || num > 25) return null;
  return num;
}

export interface ShiftContextType {
  shift: number;
  setShift: (newShift: number | ((prev: number) => number)) => void;
  incrementShift: () => void;
  decrementShift: () => void;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

/**
 * Reads initial shift from persistent storage.
 * Prioritizes 'secure_comm_active_shift', falls back to 'secure_comm_shift',
 * and defaults to 3 only if no valid shift was previously stored.
 */
function readInitialShift(): number {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const primary = localStorage.getItem(PRIMARY_SHIFT_STORAGE_KEY);
      if (primary !== null) {
        const validated = validateAndNormalizeShift(primary);
        if (validated !== null) return validated;
      }

      const legacy = localStorage.getItem(LEGACY_SHIFT_STORAGE_KEY);
      if (legacy !== null) {
        const validated = validateAndNormalizeShift(legacy);
        if (validated !== null) return validated;
      }
    }
  } catch {
    // Fallback gracefully in restricted or sandboxed environments
  }
  return DEFAULT_CAESAR_SHIFT;
}

export const ShiftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shift, setShiftState] = useState<number>(readInitialShift);

  const setShift = useCallback((newShift: number | ((prev: number) => number)) => {
    setShiftState((current) => {
      const target = typeof newShift === 'function' ? newShift(current) : newShift;
      const validated = validateAndNormalizeShift(target);
      if (validated === null) {
        // If invalid value provided, preserve current valid state (do not crash or corrupt)
        return current;
      }
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(PRIMARY_SHIFT_STORAGE_KEY, String(validated));
          localStorage.setItem(LEGACY_SHIFT_STORAGE_KEY, String(validated));
        }
      } catch {}
      try {
        syncActivityStoreShift(validated);
      } catch {}
      return validated;
    });
  }, []);

  const incrementShift = useCallback(() => {
    setShift((prev) => (prev >= 25 ? 0 : prev + 1));
  }, [setShift]);

  const decrementShift = useCallback(() => {
    setShift((prev) => (prev <= 0 ? 25 : prev - 1));
  }, [setShift]);

  // Ensure initial state is persisted and synchronized
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(PRIMARY_SHIFT_STORAGE_KEY, String(shift));
        localStorage.setItem(LEGACY_SHIFT_STORAGE_KEY, String(shift));
      }
    } catch {}
  }, [shift]);

  return (
    <ShiftContext.Provider value={{ shift, setShift, incrementShift, decrementShift }}>
      {children}
    </ShiftContext.Provider>
  );
};

/**
 * Shared hook to access and update the centralized Caesar shift state.
 */
export const useShift = (): ShiftContextType => {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
};

export const useCryptoShift = useShift;
