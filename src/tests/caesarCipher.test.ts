/**
 * @file caesarCipher.test.ts
 * @description Comprehensive automated unit test suite for the Phase 2 Caesar Cipher Engine.
 * Tests cover all required functional criteria, edge cases, alphabet wrapping, preservation, and round-trips.
 */

import {
  encrypt,
  decrypt,
  normalizeShift,
  isValidShift,
} from '../services/caesarCipher';

export interface TestCaseResult {
  category: string;
  testName: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  details?: string;
}

export function runCaesarCipherTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  function assertEqual<T>(
    category: string,
    testName: string,
    actual: T,
    expected: T,
    details?: string
  ) {
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    results.push({
      category,
      testName,
      passed,
      expected,
      actual,
      details: details || (passed ? 'Assertion passed' : `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`),
    });
  }

  // ==========================================
  // 1. REQUIRED EXAMPLES FROM SPECIFICATION
  // ==========================================
  assertEqual(
    'Required Examples',
    'ABC with shift 3 → DEF',
    encrypt('ABC', 3),
    'DEF'
  );

  assertEqual(
    'Required Examples',
    'XYZ with shift 3 → ABC (Alphabet Wrapping)',
    encrypt('XYZ', 3),
    'ABC'
  );

  assertEqual(
    'Required Examples',
    'HELLO with shift 3 → KHOOR',
    encrypt('HELLO', 3),
    'KHOOR'
  );

  assertEqual(
    'Required Examples',
    'KHOOR with shift 3 (decrypted) → HELLO',
    decrypt('KHOOR', 3),
    'HELLO'
  );

  // ==========================================
  // 2. UPPERCASE LETTERS
  // ==========================================
  assertEqual(
    'Uppercase',
    'Full uppercase alphabet with shift 1',
    encrypt('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 1),
    'BCDEFGHIJKLMNOPQRSTUVWXYZA'
  );

  assertEqual(
    'Uppercase',
    'Uppercase military callsign encryption',
    encrypt('BRAVO TACTICAL SQUADRON', 5),
    'GWFAT YFHYNHFQ XVZFIWTS'
  );

  // ==========================================
  // 3. LOWERCASE LETTERS
  // ==========================================
  assertEqual(
    'Lowercase',
    'Full lowercase alphabet with shift 1',
    encrypt('abcdefghijklmnopqrstuvwxyz', 1),
    'bcdefghijklmnopqrstuvwxyza'
  );

  assertEqual(
    'Lowercase',
    'Lowercase standard message with shift 13 (ROT13)',
    encrypt('secret mission', 13),
    'frperg zvffvba'
  );

  // ==========================================
  // 4. MIXED CASE PRESERVATION
  // ==========================================
  assertEqual(
    'Mixed Case',
    'Preserve mixed case capitalization patterns',
    encrypt('SecureMilitaryComm', 4),
    'WigyviQmpmxevcGsqq'
  );

  assertEqual(
    'Mixed Case',
    'Decrypt mixed case ciphertext',
    decrypt('WigyviQmpmxevcGsqq', 4),
    'SecureMilitaryComm'
  );

  // ==========================================
  // 5. SPACES PRESERVATION
  // ==========================================
  assertEqual(
    'Spaces',
    'Single and multiple whitespace characters preserved',
    encrypt('ALPHA   BRAVO   CHARLIE', 7),
    'HSWOH   IYHCV   JOHYSPL'
  );

  assertEqual(
    'Spaces',
    'Tab and newline spaces preserved intact',
    encrypt("LINE 1\nLINE 2\tTAB", 2),
    "NKPG 1\nNKPG 2\tVCD"
  );

  // ==========================================
  // 6. PUNCTUATION PRESERVATION
  // ==========================================
  assertEqual(
    'Punctuation',
    'Standard punctuation marks preserved (!?,.:;-)',
    encrypt('ATTACK AT DAWN! CONFIRM: YES/NO? (SECTOR-7).', 3),
    'DWWDFN DW GDZQ! FRQILUP: BHV/QR? (VHFWRU-7).'
  );

  // ==========================================
  // 7. NUMBERS & DIGITS PRESERVATION
  // ==========================================
  assertEqual(
    'Numbers',
    'Numeric coordinates and timestamps untouched',
    encrypt('GRID REF: 48.8584 N, 2.2945 E AT 0600 HOURS', 10),
    'QBSN BOP: 48.8584 X, 2.2945 O KD 0600 RYEBC'
  );

  // ==========================================
  // 8. SYMBOLS PRESERVATION
  // ==========================================
  assertEqual(
    'Symbols',
    'Special cryptographic and mathematical symbols preserved',
    encrypt('COMM_KEY#99 & SIG=$500 [FREQ=104.5MHz] ~ 100% OK', 8),
    'KWUU_SMG#99 & AQO=$500 [NZMY=104.5UPh] ~ 100% WS'
  );

  // ==========================================
  // 9. SHIFT 0 (IDENTITY TRANSFORM)
  // ==========================================
  const identityMessage = 'IDENTITY TEST: 1234 & No Change!';
  assertEqual(
    'Shift 0',
    'Shift 0 encryption produces identical string',
    encrypt(identityMessage, 0),
    identityMessage
  );

  assertEqual(
    'Shift 0',
    'Shift 0 decryption produces identical string',
    decrypt(identityMessage, 0),
    identityMessage
  );

  // ==========================================
  // 10. SHIFT 25 (MAXIMUM SHIFT / PREVIOUS LETTER)
  // ==========================================
  assertEqual(
    'Shift 25',
    'Shift 25 is mathematically equivalent to shift -1 (left by 1)',
    encrypt('BCD', 25),
    'ABC'
  );

  assertEqual(
    'Shift 25',
    'Shift 25 on ABC wraps to ZAB',
    encrypt('ABC', 25),
    'ZAB'
  );

  // ==========================================
  // 11. ALPHABET WRAPPING BOUNDARIES
  // ==========================================
  assertEqual(
    'Alphabet Wrapping',
    'End of uppercase alphabet wrap (XYZ -> ABC with shift 3)',
    encrypt('XYZ', 3),
    'ABC'
  );

  assertEqual(
    'Alphabet Wrapping',
    'End of lowercase alphabet wrap (xyz -> abc with shift 3)',
    encrypt('xyz', 3),
    'abc'
  );

  assertEqual(
    'Alphabet Wrapping',
    'Decryption wrap at beginning of alphabet (ABC -> XYZ with shift 3)',
    decrypt('ABC', 3),
    'XYZ'
  );

  // ==========================================
  // 12. EMPTY INPUT HANDLING
  // ==========================================
  assertEqual(
    'Empty Input',
    'Empty string encryption returns empty string',
    encrypt('', 5),
    ''
  );

  assertEqual(
    'Empty Input',
    'Empty string decryption returns empty string',
    decrypt('', 5),
    ''
  );

  // ==========================================
  // 13. SHIFT NORMALIZATION (NEGATIVE & LARGE SHIFTS)
  // ==========================================
  assertEqual(
    'Normalization',
    'normalizeShift(3) === 3',
    normalizeShift(3),
    3
  );

  assertEqual(
    'Normalization',
    'normalizeShift(29) === 3 (29 mod 26)',
    normalizeShift(29),
    3
  );

  assertEqual(
    'Normalization',
    'normalizeShift(-1) === 25 (-1 mod 26)',
    normalizeShift(-1),
    25
  );

  assertEqual(
    'Normalization',
    'normalizeShift(-29) === 23 (-29 mod 26)',
    normalizeShift(-29),
    23
  );

  assertEqual(
    'Normalization',
    'normalizeShift(52) === 0 (52 mod 26)',
    normalizeShift(52),
    0
  );

  assertEqual(
    'Normalization',
    'Encrypt with shift 29 equals encrypt with shift 3',
    encrypt('HELLO', 29),
    'KHOOR'
  );

  assertEqual(
    'Normalization',
    'Encrypt with shift -1 equals encrypt with shift 25',
    encrypt('ABC', -1),
    'ZAB'
  );

  // ==========================================
  // 14. INVALID SHIFT VALIDATION
  // ==========================================
  assertEqual('Validation', 'isValidShift(0) is true', isValidShift(0), true);
  assertEqual('Validation', 'isValidShift(25) is true', isValidShift(25), true);
  assertEqual('Validation', 'isValidShift(13) is true', isValidShift(13), true);
  assertEqual('Validation', 'isValidShift(-1) is false', isValidShift(-1), false);
  assertEqual('Validation', 'isValidShift(26) is false', isValidShift(26), false);
  assertEqual('Validation', 'isValidShift(100) is false', isValidShift(100), false);
  assertEqual('Validation', 'isValidShift(3.14) is false (non-integer)', isValidShift(3.14), false);
  assertEqual('Validation', 'isValidShift("3") is false (string type)', isValidShift('3'), false);
  assertEqual('Validation', 'isValidShift(NaN) is false', isValidShift(NaN), false);
  assertEqual('Validation', 'isValidShift(null) is false', isValidShift(null), false);
  assertEqual('Validation', 'isValidShift(undefined) is false', isValidShift(undefined), false);

  // ==========================================
  // 15. ROUND-TRIP ENCRYPTION / DECRYPTION VERIFICATION
  // Formula: decrypt(encrypt(message, shift), shift) === message
  // ==========================================
  const testMessages = [
    'TACTICAL AIR COMMAND: MISSION GO AT 0400Z',
    'Secret password with symbols: P@$$w0rd!_123',
    'The quick brown fox jumps over the lazy dog.',
    'MIXED case With 1234 Numbers and &*^%$# Special Symbols!',
    'A',
    'z',
    'Multi-line\nMessage\twith tabs.',
  ];

  for (let shift = 0; shift <= 25; shift++) {
    for (const msg of testMessages) {
      const ciphertext = encrypt(msg, shift);
      const plaintext = decrypt(ciphertext, shift);
      assertEqual(
        'Round-Trip Verification',
        `Round-trip shift ${shift} for: "${msg.slice(0, 18)}..."`,
        plaintext,
        msg
      );
    }
  }

  // ==========================================
  // 16. INPUT IMMUTABILITY
  // ==========================================
  const originalStr = 'IMMUTABLE_MESSAGE';
  encrypt(originalStr, 7);
  assertEqual(
    'Immutability',
    'Original input string remains unmodified after encryption',
    originalStr,
    'IMMUTABLE_MESSAGE'
  );

  return results;
}
