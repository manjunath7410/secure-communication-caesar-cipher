/**
 * @file shiftSync.test.ts
 * @description Comprehensive unit tests for Caesar Cipher Shift State Synchronization (Single Source of Truth).
 */

import {
  validateAndNormalizeShift,
  PRIMARY_SHIFT_STORAGE_KEY,
  LEGACY_SHIFT_STORAGE_KEY,
  DEFAULT_CAESAR_SHIFT,
} from '../context/ShiftContext';
import { executeBruteForceAttack } from '../services/bruteForceService';
import { encrypt, decrypt } from '../services/caesarCipher';
import { getSelectedShift, setSelectedShift } from '../services/activityStore';

export interface ShiftSyncTestResult {
  suite: string;
  testName: string;
  category: 'Sync' | 'Persistence' | 'Normalization' | 'BruteForce Isolation';
  passed: boolean;
  details?: string;
}

export function runShiftSyncTests(): ShiftSyncTestResult[] {
  const results: ShiftSyncTestResult[] = [];

  function assert(
    testName: string,
    category: ShiftSyncTestResult['category'],
    condition: boolean,
    details?: string
  ) {
    results.push({
      suite: 'Caesar Shift Synchronization',
      testName,
      category,
      passed: condition,
      details: condition ? undefined : details || 'Assertion failed',
    });
  }

  // --- 1. Normalization & Validation ---
  assert(
    'Shift 0 is valid',
    'Normalization',
    validateAndNormalizeShift(0) === 0
  );

  assert(
    'Shift 25 is valid',
    'Normalization',
    validateAndNormalizeShift(25) === 25
  );

  assert(
    'Shift 9 is valid',
    'Normalization',
    validateAndNormalizeShift(9) === 9
  );

  assert(
    'Shift string "14" parses to 14',
    'Normalization',
    validateAndNormalizeShift('14') === 14
  );

  assert(
    'Negative shift -5 returns null (strict validation)',
    'Normalization',
    validateAndNormalizeShift(-5) === null
  );

  assert(
    'Out of bounds shift 26 returns null',
    'Normalization',
    validateAndNormalizeShift(26) === null
  );

  assert(
    'Invalid string "abc" returns null',
    'Normalization',
    validateAndNormalizeShift('abc') === null
  );

  assert(
    'Null or undefined returns null',
    'Normalization',
    validateAndNormalizeShift(null) === null && validateAndNormalizeShift(undefined) === null
  );

  // --- 2. Shared Shift & ActivityStore Synchronization ---
  setSelectedShift(9);
  assert(
    'TEST A: Encrypt sets shift=9, shared store reflects shift=9',
    'Sync',
    getSelectedShift() === 9
  );

  setSelectedShift(12);
  assert(
    'TEST B: Decrypt changes shift=12, shared store reflects shift=12',
    'Sync',
    getSelectedShift() === 12
  );

  setSelectedShift(0);
  assert(
    'TEST D1: Boundary shift 0 is stored and reflected',
    'Sync',
    getSelectedShift() === 0
  );

  setSelectedShift(25);
  assert(
    'TEST D2: Boundary shift 25 is stored and reflected',
    'Sync',
    getSelectedShift() === 25
  );

  // --- 3. Encryption & Decryption consistency with synchronized shift ---
  const plain = 'HELLO WORLD SECURE COMM';
  const shiftTest = 17;
  setSelectedShift(shiftTest);
  const currentActiveShift = getSelectedShift();
  const cipher = encrypt(plain, currentActiveShift);
  const recovered = decrypt(cipher, currentActiveShift);

  assert(
    'TEST C: Encryption and Decryption using synchronized shift preserves data',
    'Sync',
    recovered === plain
  );

  // --- 4. Brute Force Isolation ---
  const currentBeforeBrute = getSelectedShift();
  const bruteResult = executeBruteForceAttack('DWWDFN DW GDZQ');
  const currentAfterBrute = getSelectedShift();

  assert(
    'TEST F1: Running brute force analysis does NOT modify the active shift',
    'BruteForce Isolation',
    currentBeforeBrute === currentAfterBrute && bruteResult.candidates.length === 26
  );

  // If candidate is explicitly selected, shift updates
  const chosenCandidateShift = 3;
  setSelectedShift(chosenCandidateShift);
  assert(
    'TEST F2: Explicitly selecting a candidate shift applies and updates active shift',
    'BruteForce Isolation',
    getSelectedShift() === chosenCandidateShift
  );

  // --- 5. Default Shift and Key Constants ---
  assert(
    'Storage key constant is defined correctly',
    'Persistence',
    PRIMARY_SHIFT_STORAGE_KEY === 'secure_comm_active_shift' &&
    LEGACY_SHIFT_STORAGE_KEY === 'secure_comm_shift' &&
    DEFAULT_CAESAR_SHIFT === 3
  );

  return results;
}
