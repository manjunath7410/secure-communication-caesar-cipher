/**
 * @file caesarCipher.ts
 * @description Production-quality educational Caesar Cipher service.
 * Implements classical monoalphabetic substitution: E(x) = (x + k) mod 26, D(x) = (x - k) mod 26.
 *
 * ZERO-LEAKAGE SECURITY POLICY:
 * This module runs strictly client-side. No plaintext is sent to external APIs or loggers.
 * Academic Cryptography Notice: Caesar Cipher is an educational cipher with k in [0, 25].
 */

/**
 * Validates whether a given shift value is a valid integer within the standard Caesar keyspace [0, 25].
 *
 * @param shift - The shift value to validate
 * @returns True if shift is an integer between 0 and 25 inclusive, false otherwise
 */
export function isValidShift(shift: unknown): boolean {
  if (typeof shift !== 'number') return false;
  if (!Number.isInteger(shift)) return false;
  if (Number.isNaN(shift)) return false;
  return shift >= 0 && shift <= 25;
}

/**
 * Normalizes any numerical shift value (including negative numbers and values >= 26)
 * to a safe integer in the mathematical modulo ring [0, 25].
 *
 * Formula: ((shift % 26) + 26) % 26
 *
 * @param shift - The raw shift number to normalize
 * @returns An integer in the range 0 to 25
 */
export function normalizeShift(shift: number): number {
  if (typeof shift !== 'number' || Number.isNaN(shift) || !Number.isFinite(shift)) {
    return 0;
  }
  const intShift = Math.floor(shift);
  return ((intShift % 26) + 26) % 26;
}

/**
 * Encrypts plaintext using the Caesar Cipher algorithm.
 *
 * Mathematical Definition:
 * E(x) = (x + k) mod 26
 *
 * Characteristics:
 * - Preserves letter casing (uppercase remains uppercase, lowercase remains lowercase)
 * - Preserves all spaces, punctuation, digits, symbols, and whitespace
 * - Wraps seamlessly around alphabet boundaries (Z -> A, z -> a)
 * - Normalizes shifts outside [0, 25] safely
 * - Does not mutate the input string
 * - Returns empty string for empty inputs
 *
 * @param text - The plaintext string to encrypt
 * @param shift - The shift key (k)
 * @returns The resulting ciphertext
 */
export function encrypt(text: string, shift: number): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const k = normalizeShift(shift);
  if (k === 0) {
    return text;
  }

  let result = '';
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const code = text.charCodeAt(i);

    // Uppercase English Letters: 'A' (65) to 'Z' (90)
    if (code >= 65 && code <= 90) {
      const encryptedCode = ((code - 65 + k) % 26) + 65;
      result += String.fromCharCode(encryptedCode);
    }
    // Lowercase English Letters: 'a' (97) to 'z' (122)
    else if (code >= 97 && code <= 122) {
      const encryptedCode = ((code - 97 + k) % 26) + 97;
      result += String.fromCharCode(encryptedCode);
    }
    // Non-alphabetic characters (spaces, digits, punctuation, symbols) are preserved
    else {
      result += text[i];
    }
  }

  return result;
}

/**
 * Decrypts ciphertext using the Caesar Cipher algorithm.
 *
 * Mathematical Definition:
 * D(x) = (x - k) mod 26
 * Equivalent to: E(x, (26 - (k mod 26)) mod 26)
 *
 * Characteristics:
 * - Inverts the transformation applied by encrypt(text, shift)
 * - Preserves letter casing, spaces, digits, punctuation, and symbols
 * - Does not mutate the input string
 * - Guaranteed round-trip identity: decrypt(encrypt(text, k), k) === text
 *
 * @param text - The ciphertext string to decrypt
 * @param shift - The shift key (k) used during encryption
 * @returns The recovered plaintext
 */
export function decrypt(text: string, shift: number): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const k = normalizeShift(shift);
  if (k === 0) {
    return text;
  }

  let result = '';
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const code = text.charCodeAt(i);

    // Uppercase English Letters: 'A' (65) to 'Z' (90)
    if (code >= 65 && code <= 90) {
      const decryptedCode = ((code - 65 - k + 26) % 26) + 65;
      result += String.fromCharCode(decryptedCode);
    }
    // Lowercase English Letters: 'a' (97) to 'z' (122)
    else if (code >= 97 && code <= 122) {
      const decryptedCode = ((code - 97 - k + 26) % 26) + 97;
      result += String.fromCharCode(decryptedCode);
    }
    // Non-alphabetic characters are preserved
    else {
      result += text[i];
    }
  }

  return result;
}

export function rot13(text: string): string {
  return encrypt(text, 13);
}

export const caesarEncrypt = encrypt;
export const caesarDecrypt = decrypt;

/**
 * Comprehensive Caesar Cipher Service object encapsulating all cryptographic methods.
 */
export const CaesarCipherService = {
  encrypt,
  decrypt,
  caesarEncrypt,
  caesarDecrypt,
  rot13,
  normalizeShift,
  isValidShift,
};

export default CaesarCipherService;
