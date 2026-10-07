/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TACTICAL_PRESETS, TacticalPreset } from '../components/dashboard/MilitaryRadioSimulator';
import { encrypt, decrypt, normalizeShift } from '../services/caesarCipher';
import { executeBruteForceAttack } from '../services/bruteForceService';

export interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

export async function runTacticalRadioPresetsTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const runTest = (name: string, fn: () => void) => {
    const start = performance.now();
    try {
      fn();
      results.push({
        name,
        category: 'Phase 17: Tactical Radio Presets & Simulator',
        passed: true,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    } catch (err: any) {
      results.push({
        name,
        category: 'Phase 17: Tactical Radio Presets & Simulator',
        passed: false,
        message: err?.message || String(err),
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    }
  };

  // Test 1: Presets Structure & Metadata Validity
  runTest('T17.1: All tactical presets have valid code, label, frequency, callsign, and text', () => {
    if (!Array.isArray(TACTICAL_PRESETS) || TACTICAL_PRESETS.length === 0) {
      throw new Error('TACTICAL_PRESETS must be a non-empty array.');
    }

    const seenCodes = new Set<string>();

    for (const preset of TACTICAL_PRESETS) {
      if (!preset.code || typeof preset.code !== 'string') {
        throw new Error(`Invalid code in preset: ${JSON.stringify(preset)}`);
      }
      if (seenCodes.has(preset.code)) {
        throw new Error(`Duplicate preset code found: ${preset.code}`);
      }
      seenCodes.add(preset.code);

      if (!preset.label || typeof preset.label !== 'string') {
        throw new Error(`Invalid label in preset ${preset.code}`);
      }
      if (!preset.frequency || !preset.frequency.includes('MHz')) {
        throw new Error(`Preset ${preset.code} missing valid frequency format (e.g. 142.85 MHz)`);
      }
      if (!preset.callsign || typeof preset.callsign !== 'string') {
        throw new Error(`Preset ${preset.code} missing callsign`);
      }
      if (!preset.text || preset.text.trim().length < 10) {
        throw new Error(`Preset ${preset.code} has insufficient text payload`);
      }
    }
  });

  // Test 2: Standard Caesar Shift (k=3) Round-Trip Encryption and Decryption
  runTest('T17.2: Standard Caesar Shift (k=3) encrypts and decrypts all presets with 100% fidelity', () => {
    const k = 3;
    for (const preset of TACTICAL_PRESETS) {
      const ciphertext = encrypt(preset.text, k);

      if (!ciphertext || ciphertext === preset.text) {
        throw new Error(`Preset ${preset.code} failed to produce distinct ciphertext for shift ${k}`);
      }

      // Verify colons, punctuation, spaces, and digits are untouched
      for (let i = 0; i < preset.text.length; i++) {
        const origChar = preset.text[i];
        if (!/[a-zA-Z]/.test(origChar)) {
          if (ciphertext[i] !== origChar) {
            throw new Error(
              `Non-alphabetic character '${origChar}' at index ${i} was altered in ${preset.code}: '${ciphertext[i]}'`
            );
          }
        }
      }

      const recovered = decrypt(ciphertext, k);
      if (recovered !== preset.text) {
        throw new Error(
          `Decryption mismatch for ${preset.code}.\nExpected: "${preset.text}"\nReceived: "${recovered}"`
        );
      }
    }
  });

  // Test 3: ROT13 Shift (k=13) Involution Property on Presets
  runTest('T17.3: Symmetric ROT13 (k=13) involution property holds for all presets E_13(E_13(M)) = M', () => {
    for (const preset of TACTICAL_PRESETS) {
      const encryptedOnce = encrypt(preset.text, 13);
      const encryptedTwice = encrypt(encryptedOnce, 13);

      if (encryptedTwice !== preset.text) {
        throw new Error(`ROT13 involution failed for ${preset.code}. E_13(E_13(M)) !== M`);
      }
    }
  });

  // Test 4: All 26 Modulo Keys Round-Trip Verification across All Presets
  runTest('T17.4: Exhaustive key sweep (k=0 to 25) verifies mathematical invertibility across all presets', () => {
    for (const preset of TACTICAL_PRESETS) {
      for (let shift = 0; shift <= 25; shift++) {
        const cipher = encrypt(preset.text, shift);
        const plain = decrypt(cipher, shift);
        if (plain !== preset.text) {
          throw new Error(`Reversibility failed for ${preset.code} at shift ${shift}`);
        }
      }
    }
  });

  // Test 5: Automated Brute-Force Cryptanalysis Successfully Recovers Preset Plaintext
  runTest('T17.5: Automated brute-force analyzer detects original shift for preset transmissions', () => {
    const testShift = 4; // Shift Delta-4
    for (const preset of TACTICAL_PRESETS) {
      const cipher = encrypt(preset.text, testShift);
      const analysis = executeBruteForceAttack(cipher);

      if (analysis.totalCandidates !== 26 || analysis.candidates.length !== 26) {
        throw new Error(`Expected 26 permutations from brute-force analyzer, got ${analysis.totalCandidates}`);
      }

      const match = analysis.candidates.find((c) => c.shift === testShift);
      if (!match) {
        throw new Error(`Candidate at shift ${testShift} missing in brute-force results`);
      }

      if (match.candidatePlaintext !== preset.text) {
        throw new Error(`Candidate text at shift ${testShift} did not match original preset text`);
      }
    }
  });

  return results;
}
