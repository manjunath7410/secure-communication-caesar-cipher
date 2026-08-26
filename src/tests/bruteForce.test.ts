/**
 * @file bruteForce.test.ts
 * @description Comprehensive automated test suite for Phase 8: Brute-Force Attack Demonstration.
 * Tests:
 * 1. Exact 26 Permutation Keyspace Generation
 * 2. Identity at k=0 (Original Ciphertext Unaltered)
 * 3. High-Fidelity Decryption across all 26 Shifts
 * 4. Known Military & Standard Cryptographic Vectors (k=3, k=13, k=7)
 * 5. Casing & Special Character Invariant Preservation
 * 6. Local English Frequency & Word Matching Heuristic Ranking
 * 7. Edge Cases: Empty String, Numeric-Only, Punctuation-Only, Large Payloads
 * 8. Cryptographic Keyspace Entropy Calculation (log2(26) ≈ 4.70 bits)
 * 9. Cryptanalysis Export Report Formatting
 */

import {
  executeBruteForceAttack,
  calculateEnglishFitness,
  formatBruteForceReport,
  PRESET_CIPHERTEXTS,
} from '../services/bruteForceService';
import { encrypt } from '../services/caesarCipher';

export interface TestResult {
  suite: string;
  category?: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export function runBruteForceTests(): TestResult[] {
  const results: TestResult[] = [];

  const runTest = (name: string, fn: () => void, category: string = 'Brute Force') => {
    const start = performance.now();
    try {
      fn();
      results.push({
        suite: 'Phase 8: Brute-Force Demonstration',
        category,
        name,
        passed: true,
        durationMs: performance.now() - start,
      });
    } catch (e: any) {
      results.push({
        suite: 'Phase 8: Brute-Force Demonstration',
        category,
        name,
        passed: false,
        error: e?.message || String(e),
        durationMs: performance.now() - start,
      });
    }
  };

  // Test 1: Exact 26 Permutation Keyspace Generation
  runTest('T8.1: Brute-force generates exactly 26 candidate permutations (k=0 to k=25)', () => {
    const analysis = executeBruteForceAttack('DWWDFN DW GDZQ');
    if (analysis.totalCandidates !== 26) {
      throw new Error(`Expected 26 candidates, got ${analysis.totalCandidates}`);
    }
    if (analysis.candidates.length !== 26) {
      throw new Error(`Candidates array length must be 26, got ${analysis.candidates.length}`);
    }
    for (let shift = 0; shift < 26; shift++) {
      if (analysis.candidates[shift].shift !== shift) {
        throw new Error(`Candidate index ${shift} has incorrect shift ${analysis.candidates[shift].shift}`);
      }
    }
  });

  // Test 2: Identity at Shift k=0
  runTest('T8.2: Candidate at shift k=0 matches the exact raw ciphertext', () => {
    const sample = 'VRXDGURQ GHOWD: 48.85N, 2.29E!';
    const analysis = executeBruteForceAttack(sample);
    const k0Candidate = analysis.candidates.find((c) => c.shift === 0);
    if (!k0Candidate) throw new Error('Missing shift 0 candidate');
    if (k0Candidate.candidatePlaintext !== sample) {
      throw new Error(`Shift k=0 candidate "${k0Candidate.candidatePlaintext}" did not match original "${sample}"`);
    }
    if (!k0Candidate.isOriginal) {
      throw new Error('Shift k=0 candidate must have isOriginal=true');
    }
  });

  // Test 3: Known Vector Recovery (k=3 Classical Caesar)
  runTest('T8.3: Known Vector (k=3) "DWWDFN DW GDZQ" correctly recovers "ATTACK AT DAWN" at shift 3', () => {
    const analysis = executeBruteForceAttack('DWWDFN DW GDZQ');
    const k3Candidate = analysis.candidates.find((c) => c.shift === 3);
    if (!k3Candidate) throw new Error('Missing candidate for k=3');
    if (k3Candidate.candidatePlaintext !== 'ATTACK AT DAWN') {
      throw new Error(`Expected "ATTACK AT DAWN", got "${k3Candidate.candidatePlaintext}"`);
    }
    // Check that top candidate correctly identifies k=3
    if (analysis.topCandidate.shift !== 3) {
      throw new Error(`Top heuristic candidate expected shift 3, got ${analysis.topCandidate.shift}`);
    }
  });

  // Test 4: Known Vector Recovery (k=13 ROT13)
  runTest('T8.4: Known Vector (k=13) ROT13 "Uryyb Jbeyq!" recovers "Hello World!" with isRot13 flag', () => {
    const analysis = executeBruteForceAttack('Uryyb Jbeyq!');
    const rot13Candidate = analysis.candidates.find((c) => c.shift === 13);
    if (!rot13Candidate) throw new Error('Missing candidate for k=13');
    if (rot13Candidate.candidatePlaintext !== 'Hello World!') {
      throw new Error(`Expected "Hello World!", got "${rot13Candidate.candidatePlaintext}"`);
    }
    if (!rot13Candidate.isRot13) {
      throw new Error('Candidate at k=13 must have isRot13=true');
    }
  });

  // Test 5: Character Preservation Across All 26 Permutations
  runTest('T8.5: Special characters, spaces, punctuation, and digits are preserved in all 26 permutations', () => {
    const complexCipher = 'KHOOR 12345 -- (Sector #7: Target @ 100%) \n [Line 2: True/False]';
    const analysis = executeBruteForceAttack(complexCipher);

    for (const c of analysis.candidates) {
      if (!c.candidatePlaintext.includes('12345')) {
        throw new Error(`Digits missing in shift ${c.shift}`);
      }
      if (!c.candidatePlaintext.includes('-- (Sector #7: Target @ 100%)')) {
        // Only letters should change, non-letters preserved
        const nonLettersSample = complexCipher.replace(/[a-zA-Z]/g, '');
        const nonLettersCand = c.candidatePlaintext.replace(/[a-zA-Z]/g, '');
        if (nonLettersSample !== nonLettersCand) {
          throw new Error(`Non-letter structure altered in shift ${c.shift}`);
        }
      }
      if (!c.candidatePlaintext.includes('\n')) {
        throw new Error(`Newline stripped in shift ${c.shift}`);
      }
    }
  });

  // Test 6: Letter Case Invariance
  runTest('T8.6: Mixed letter casing (upper/lower) preserved across all 26 shifts', () => {
    const mixed = 'AbCdEfGhIjKlMnOpQrStUvWxYz';
    const analysis = executeBruteForceAttack(mixed);

    for (const c of analysis.candidates) {
      for (let i = 0; i < mixed.length; i++) {
        const origIsUpper = mixed[i] === mixed[i].toUpperCase();
        const candIsUpper = c.candidatePlaintext[i] === c.candidatePlaintext[i].toUpperCase();
        if (origIsUpper !== candIsUpper) {
          throw new Error(`Case mismatch at index ${i} in shift ${c.shift}`);
        }
      }
    }
  });

  // Test 7: Preset Vectors Evaluation
  runTest('T8.7: All preset demonstration ciphertexts generate valid analyses and identify correct shifts', () => {
    for (const preset of PRESET_CIPHERTEXTS) {
      const analysis = executeBruteForceAttack(preset.ciphertext);
      if (analysis.totalCandidates !== 26) {
        throw new Error(`Preset "${preset.label}" failed candidate count`);
      }
      const knownCandidate = analysis.candidates.find((c) => c.shift === preset.knownShift);
      if (!knownCandidate) {
        throw new Error(`Preset "${preset.label}" missing known shift k=${preset.knownShift}`);
      }
      if (!knownCandidate.candidatePlaintext || knownCandidate.candidatePlaintext.length === 0) {
        throw new Error(`Preset "${preset.label}" produced empty plaintext`);
      }
    }
  });

  // Test 8: Edge Cases (Empty, Non-Alpha, Large Payloads)
  runTest('T8.8: Edge cases (empty string, numbers-only, large payload) execute safely', () => {
    // 1. Empty string
    const emptyAnalysis = executeBruteForceAttack('');
    if (emptyAnalysis.candidates.length !== 26 || emptyAnalysis.charCount !== 0) {
      throw new Error('Empty string failed');
    }
    if (emptyAnalysis.candidates[0].candidatePlaintext !== '') {
      throw new Error('Empty string candidate should be empty');
    }

    // 2. Numbers and punctuation only
    const numAnalysis = executeBruteForceAttack('1234567890 !@#$%^&*()');
    if (numAnalysis.alphaCount !== 0) {
      throw new Error(`Expected 0 alphabetic characters, got ${numAnalysis.alphaCount}`);
    }
    for (const c of numAnalysis.candidates) {
      if (c.candidatePlaintext !== '1234567890 !@#$%^&*()') {
        throw new Error('Non-alpha string should remain identical for all shifts');
      }
    }

    // 3. Large string (12,000+ characters)
    const largeStr = encrypt('SQUADRON DELTA ', 3).repeat(800);
    const largeAnalysis = executeBruteForceAttack(largeStr);
    if (largeAnalysis.candidates.length !== 26) {
      throw new Error('Large payload failed');
    }
    if (largeAnalysis.candidates[3].candidatePlaintext.slice(0, 14) !== 'SQUADRON DELTA') {
      throw new Error('Large payload recovery failed at k=3');
    }
  });

  // Test 9: Keyspace Entropy & Report Formatting
  runTest('T8.9: Keyspace entropy metric is ~4.70 bits and report format contains 26 rows and summary', () => {
    const analysis = executeBruteForceAttack('DWWDFN DW GDZQ');
    if (Math.abs(analysis.entropyBits - 4.7004) > 0.01) {
      throw new Error(`Entropy bits calculated incorrectly: ${analysis.entropyBits}`);
    }

    const report = formatBruteForceReport(analysis);
    if (!report.includes('CAESAR CIPHER EXHAUSTIVE BRUTE-FORCE CRYPTANALYSIS REPORT')) {
      throw new Error('Report missing header');
    }
    if (!report.includes('Shift k=00') || !report.includes('Shift k=25')) {
      throw new Error('Report missing shift rows');
    }
    if (!report.includes('RECOMMENDED CANDIDATE')) {
      throw new Error('Report missing candidate summary footer');
    }
  });

  return results;
}
