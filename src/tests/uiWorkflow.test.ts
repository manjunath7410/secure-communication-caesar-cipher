/**
 * @file uiWorkflow.test.ts
 * @description Test suite for Phase 4: Encrypt and Decrypt UI workflows and edge cases.
 */

import { encrypt, decrypt, isValidShift, normalizeShift } from '../services/caesarCipher';

export interface WorkflowTestResult {
  suite: string;
  testName: string;
  category: 'Validation' | 'Encryption Workflow' | 'Decryption Workflow' | 'Edge Cases' | 'Round-Trip Identity';
  passed: boolean;
  details?: string;
}

/**
 * Validates shift input parsing logic identical to the UI components
 */
export function validateShiftInput(shiftInput: string): {
  valid: boolean;
  value: number;
  isNormalized: boolean;
  error?: string;
  notice?: string;
} {
  const trimmed = shiftInput.trim();
  if (trimmed === '') {
    return { valid: false, value: 0, isNormalized: false, error: 'Shift key cannot be empty.' };
  }

  const num = Number(trimmed);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return { valid: false, value: 0, isNormalized: false, error: 'Shift key must be a numeric integer.' };
  }

  if (!Number.isInteger(num)) {
    return { valid: false, value: 0, isNormalized: false, error: 'Shift key cannot be a decimal/float.' };
  }

  if (num < 0 || num > 25) {
    const normalized = normalizeShift(num);
    return {
      valid: true,
      value: normalized,
      isNormalized: true,
      notice: `Shift ${num} normalized to ${normalized}`,
    };
  }

  return { valid: true, value: num, isNormalized: false };
}

/**
 * Runs all Phase 4 UI workflow unit tests
 */
export function runUIWorkflowTests(): WorkflowTestResult[] {
  const results: WorkflowTestResult[] = [];

  function assert(
    testName: string,
    category: WorkflowTestResult['category'],
    condition: boolean,
    details?: string
  ) {
    results.push({
      suite: 'Phase 4 UI Workflow',
      testName,
      category,
      passed: condition,
      details: condition ? undefined : details || 'Assertion failed',
    });
  }

  // --- 1. Validation Edge Cases ---
  const emptyShiftCheck = validateShiftInput('');
  assert(
    'Shift validation rejects empty string',
    'Validation',
    !emptyShiftCheck.valid && emptyShiftCheck.error !== undefined
  );

  const whitespaceShiftCheck = validateShiftInput('   ');
  assert(
    'Shift validation rejects pure whitespace string',
    'Validation',
    !whitespaceShiftCheck.valid
  );

  const nonNumericShiftCheck = validateShiftInput('invalid_abc');
  assert(
    'Shift validation rejects non-numeric string "invalid_abc"',
    'Validation',
    !nonNumericShiftCheck.valid
  );

  const decimalShiftCheck = validateShiftInput('3.14159');
  assert(
    'Shift validation rejects decimal/float shift "3.14159"',
    'Validation',
    !decimalShiftCheck.valid
  );

  const negativeDecimalShiftCheck = validateShiftInput('-5.5');
  assert(
    'Shift validation rejects negative decimal shift "-5.5"',
    'Validation',
    !negativeDecimalShiftCheck.valid
  );

  const validShiftCheck = validateShiftInput('3');
  assert(
    'Shift validation accepts valid integer "3"',
    'Validation',
    validShiftCheck.valid && validShiftCheck.value === 3 && !validShiftCheck.isNormalized
  );

  const outOfRangePositiveCheck = validateShiftInput('29');
  assert(
    'Shift validation normalizes positive out-of-range "29" to k=3',
    'Validation',
    outOfRangePositiveCheck.valid && outOfRangePositiveCheck.value === 3 && outOfRangePositiveCheck.isNormalized
  );

  const outOfRangeNegativeCheck = validateShiftInput('-3');
  assert(
    'Shift validation normalizes negative out-of-range "-3" to k=23',
    'Validation',
    outOfRangeNegativeCheck.valid && outOfRangeNegativeCheck.value === 23 && outOfRangeNegativeCheck.isNormalized
  );

  const outOfRangeExact26Check = validateShiftInput('26');
  assert(
    'Shift validation normalizes "26" to k=0',
    'Validation',
    outOfRangeExact26Check.valid && outOfRangeExact26Check.value === 0 && outOfRangeExact26Check.isNormalized
  );

  const outOfRangeLarge52Check = validateShiftInput('52');
  assert(
    'Shift validation normalizes "52" to k=0',
    'Validation',
    outOfRangeLarge52Check.valid && outOfRangeLarge52Check.value === 0 && outOfRangeLarge52Check.isNormalized
  );

  // --- 2. Encryption Workflow ---
  const encEmpty = encrypt('', 3);
  assert(
    'Encryption handles empty string gracefully',
    'Encryption Workflow',
    encEmpty === ''
  );

  const encClassic = encrypt('ATTACK AT DAWN', 3);
  assert(
    'Encryption transforms "ATTACK AT DAWN" (k=3) -> "DWWDFN DW GDZQ"',
    'Encryption Workflow',
    encClassic === 'DWWDFN DW GDZQ',
    `Expected DWWDFN DW GDZQ, got ${encClassic}`
  );

  const encMixedCase = encrypt('Attack At Dawn', 3);
  assert(
    'Encryption preserves letter casing: "Attack At Dawn" (k=3) -> "Dwwdfn Dw Gdzq"',
    'Encryption Workflow',
    encMixedCase === 'Dwwdfn Dw Gdzq',
    `Expected Dwwdfn Dw Gdzq, got ${encMixedCase}`
  );

  const encRot13 = encrypt('Hello World!', 13);
  assert(
    'Encryption handles ROT13 (k=13): "Hello World!" -> "Uryyb Jbeyq!"',
    'Encryption Workflow',
    encRot13 === 'Uryyb Jbeyq!',
    `Expected Uryyb Jbeyq!, got ${encRot13}`
  );

  const encZeroShift = encrypt('Top Secret Data', 0);
  assert(
    'Encryption with k=0 returns exact unaltered plaintext',
    'Encryption Workflow',
    encZeroShift === 'Top Secret Data'
  );

  // --- 3. Decryption Workflow ---
  const decEmpty = decrypt('', 3);
  assert(
    'Decryption handles empty string gracefully',
    'Decryption Workflow',
    decEmpty === ''
  );

  const decClassic = decrypt('DWWDFN DW GDZQ', 3);
  assert(
    'Decryption inverts "DWWDFN DW GDZQ" (k=3) -> "ATTACK AT DAWN"',
    'Decryption Workflow',
    decClassic === 'ATTACK AT DAWN',
    `Expected ATTACK AT DAWN, got ${decClassic}`
  );

  const decRot13 = decrypt('Uryyb Jbeyq!', 13);
  assert(
    'Decryption inverts ROT13 (k=13): "Uryyb Jbeyq!" -> "Hello World!"',
    'Decryption Workflow',
    decRot13 === 'Hello World!',
    `Expected Hello World!, got ${decRot13}`
  );

  // --- 4. Edge Cases: Numbers, Special Characters, Whitespace, Very Long Input ---
  const specialCharsText = 'Password@2026! #Secure $100.00 & 50% [ALPHA-7] {v1.2.3}';
  const encSpecial = encrypt(specialCharsText, 4);
  const decSpecial = decrypt(encSpecial, 4);
  assert(
    'Special characters and numbers are preserved exactly during encryption',
    'Edge Cases',
    encSpecial.includes('@2026!') && encSpecial.includes('#') && encSpecial.includes('$100.00') && encSpecial.includes('50%')
  );
  assert(
    'Special characters and numbers round-trip correctly',
    'Edge Cases',
    decSpecial === specialCharsText,
    `Expected ${specialCharsText}, got ${decSpecial}`
  );

  const multiLineText = 'LINE 1: ALPHA\nLINE 2: BRAVO\tTABBED\r\nLINE 3: CHARLIE   SPACED';
  const encMultiline = encrypt(multiLineText, 5);
  const decMultiline = decrypt(encMultiline, 5);
  assert(
    'Whitespace, tabs, and newlines (\\n, \\r\\n, \\t, spaces) are preserved exactly',
    'Edge Cases',
    decMultiline === multiLineText
  );

  // Very Long Input (10,000+ characters)
  const paragraph = 'TACTICAL ENCRYPTION TEST PAYLOAD 2026. THE CAESAR CIPHER SHIFTS LETTERS BY CONSTANT OFFSET K IN MODULO 26. ';
  const longText = paragraph.repeat(100); // ~11,000 characters
  const encLong = encrypt(longText, 7);
  const decLong = decrypt(encLong, 7);
  assert(
    'Very long input (11,000+ characters) encrypts and recovers without corruption or truncation',
    'Edge Cases',
    encLong.length === longText.length && decLong === longText
  );

  // Boundary alphabet wrapping
  assert(
    'Alphabet boundary wrap: "XYZ" (k=3) -> "ABC"',
    'Edge Cases',
    encrypt('XYZ', 3) === 'ABC' && decrypt('ABC', 3) === 'XYZ'
  );
  assert(
    'Alphabet boundary wrap: "xyz" (k=3) -> "abc"',
    'Edge Cases',
    encrypt('xyz', 3) === 'abc' && decrypt('abc', 3) === 'xyz'
  );
  assert(
    'Alphabet boundary wrap: "A" (k=25) -> "Z"',
    'Edge Cases',
    encrypt('A', 25) === 'Z' && decrypt('Z', 25) === 'A'
  );

  // --- 5. Comprehensive Round-Trip Invariant for All Keys [0..25] ---
  const sampleMessages = [
    'TACTICAL AIR COMMAND: ALL UNITS STAND BY FOR ORDERS AT 0600Z.',
    'Mixed CASE test with 1234567890 and punctuation: !@#$%^&*()_+-=[]{}|;:,.<>?',
    'Single line with multiple spaces    and    tabs\t\t\there.',
    'A',
    'Z',
    'a',
    'z',
  ];

  let roundTripAllPassed = true;
  for (let k = 0; k < 26; k++) {
    for (const msg of sampleMessages) {
      const cipher = encrypt(msg, k);
      const plain = decrypt(cipher, k);
      if (plain !== msg) {
        roundTripAllPassed = false;
        break;
      }
    }
    if (!roundTripAllPassed) break;
  }

  assert(
    'Complete mathematical round-trip identity holds for all k in [0, 25] across all test payloads',
    'Round-Trip Identity',
    roundTripAllPassed
  );

  return results;
}
