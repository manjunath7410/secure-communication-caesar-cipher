/**
 * @file bruteForceService.ts
 * @description Educational Brute-Force Cryptanalysis Engine for Caesar Cipher (Phase 8).
 *
 * CRITICAL SECURITY & PRIVACY POLICY:
 * - Runs 100% locally on client-side memory.
 * - Zero plaintext/ciphertext is ever transmitted to AI models, external servers, or remote telemetry.
 * - Purpose: Pure academic demonstration of Caesar Cipher's fundamental vulnerability.
 *   Keyspace size is exactly 26 (log2(26) ≈ 4.7 bits of entropy), rendering brute-force trivial.
 */

import { decrypt } from './caesarCipher';
import {
  BruteForceCandidate,
  BruteForceAnalysis,
  PresetCiphertext,
} from '../types/bruteForce';

// Standard English Letter Frequencies (Normalized percentages in typical text)
const ENGLISH_FREQUENCIES: Record<string, number> = {
  E: 12.70, T: 9.06, A: 8.17, O: 7.51, I: 6.97, N: 6.75, S: 6.33, H: 6.09,
  R: 5.99, D: 4.25, L: 4.03, C: 2.78, U: 2.76, M: 2.41, W: 2.36, F: 2.23,
  G: 2.02, Y: 1.97, P: 1.93, B: 1.29, V: 0.98, K: 0.77, J: 0.15, X: 0.15,
  Q: 0.10, Z: 0.07,
};

// Common English words & military vocabulary for heuristic scoring
const COMMON_DICTIONARY_WORDS = new Set([
  'THE', 'BE', 'TO', 'OF', 'AND', 'A', 'IN', 'THAT', 'HAVE', 'I',
  'IT', 'FOR', 'NOT', 'ON', 'WITH', 'HE', 'AS', 'YOU', 'DO', 'AT',
  'THIS', 'BUT', 'HIS', 'BY', 'FROM', 'THEY', 'WE', 'SAY', 'HER', 'SHE',
  'OR', 'AN', 'WILL', 'MY', 'ONE', 'ALL', 'WOULD', 'THERE', 'THEIR', 'WHAT',
  'SO', 'UP', 'OUT', 'IF', 'ABOUT', 'WHO', 'GET', 'WHICH', 'GO', 'ME',
  'ATTACK', 'DAWN', 'DEFENSE', 'SECTOR', 'GRID', 'RADAR', 'COMMAND', 'REPORT',
  'ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'SQUADRON', 'BASE', 'TARGET', 'CONFIRMED',
  'OPERATION', 'MISSION', 'STATUS', 'SECURE', 'HELLO', 'WORLD', 'SECRET', 'AIR',
  'TACTICAL', 'CLEARANCE', 'PROTOCOL', 'BEACON', 'BEARING', 'SIGNAL', 'ZONE'
]);

export const PRESET_CIPHERTEXTS: PresetCiphertext[] = [
  {
    id: 'preset-1',
    label: 'Tactical Recon (k=3)',
    ciphertext: 'VRXDGURQ GHOWD: SURFHHG WR JULG 48.85Q, 2.29H DW 0600C.',
    knownShift: 3,
    description: 'Standard historical shift (k=3) ordering tactical squad movements.',
  },
  {
    id: 'preset-2',
    label: 'Dawn Strike Order (k=3)',
    ciphertext: 'DWWDFN DW GDZQ. VHFWRU 7 FRQILUPHG.',
    knownShift: 3,
    description: 'Classic Caesar battlefield dispatch with punctuation preservation.',
  },
  {
    id: 'preset-3',
    label: 'Symmetric ROT13 (k=13)',
    ciphertext: 'PBASVQ ragvny gnp gvpny cebgbpby nycun-9: ERGHERG GB ONFR',
    knownShift: 13,
    description: 'Half-alphabet rotation where encryption and decryption shifts are identical.',
  },
  {
    id: 'preset-4',
    label: 'Air Defense Ping (k=7)',
    ciphertext: 'AHAJBT HSYT: VYVIHISP AFWLLK HYAPSSLWF ZWVWALK HUK YLHKF.',
    knownShift: 7,
    description: 'Radar perimeter alert with punctuation and military callouts.',
  },
  {
    id: 'preset-5',
    label: 'Classic Caesar Greeting (k=3)',
    ciphertext: 'KHOOR ZRUOG! FDHVDU FLSKHU LV EUHDNDEOH LQ 26 VKLIWV.',
    knownShift: 3,
    description: 'Introductory demonstrator showcasing trivial keyspace exhaustion.',
  },
];

/**
 * Computes a local fitness score for candidate text based on English monograms and common word matches.
 */
export function calculateEnglishFitness(text: string): { score: number; wordMatches: string[] } {
  if (!text || text.length === 0) {
    return { score: 0, wordMatches: [] };
  }

  const cleanUpper = text.toUpperCase();
  const lettersOnly = cleanUpper.replace(/[^A-Z]/g, '');
  const totalLetters = lettersOnly.length;

  if (totalLetters === 0) {
    return { score: 0, wordMatches: [] };
  }

  // 1. Frequency correlation score
  const counts: Record<string, number> = {};
  for (let i = 0; i < totalLetters; i++) {
    const char = lettersOnly[i];
    counts[char] = (counts[char] || 0) + 1;
  }

  let freqScore = 0;
  for (const char in counts) {
    const observedFreq = (counts[char] / totalLetters) * 100;
    const expectedFreq = ENGLISH_FREQUENCIES[char] || 0.01;
    // Dot product correlation metric
    freqScore += observedFreq * expectedFreq;
  }

  // 2. Tokenized word matches
  const tokens = cleanUpper.split(/[^A-Z0-9]+/).filter((w) => w.length >= 2);
  const wordMatches: string[] = [];
  let wordScore = 0;

  for (const token of tokens) {
    if (COMMON_DICTIONARY_WORDS.has(token)) {
      if (!wordMatches.includes(token)) {
        wordMatches.push(token);
      }
      wordScore += token.length * 15;
    }
  }

  const totalScore = Math.round(freqScore + wordScore);
  return { score: totalScore, wordMatches };
}

/**
 * Generates all 26 possible Caesar Cipher shifts for a given ciphertext.
 * For each shift k in [0, 25], candidatePlaintext = D(ciphertext, k).
 *
 * @param ciphertext - The input string to attack via exhaustive keyspace search
 * @returns Complete BruteForceAnalysis report with all 26 permutations
 */
export function executeBruteForceAttack(ciphertext: string): BruteForceAnalysis {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const safeText = typeof ciphertext === 'string' ? ciphertext : '';

  const candidates: BruteForceCandidate[] = [];

  for (let shift = 0; shift < 26; shift++) {
    const candidatePlaintext = decrypt(safeText, shift);
    const { score, wordMatches } = calculateEnglishFitness(candidatePlaintext);

    candidates.push({
      shift,
      candidatePlaintext,
      isOriginal: shift === 0,
      isRot13: shift === 13,
      score,
      wordMatches,
    });
  }

  // Identify top candidate by score
  let topCandidate = candidates[0];
  for (const c of candidates) {
    if (c.score > topCandidate.score) {
      topCandidate = c;
    }
  }

  // Mark top candidate flag
  for (const c of candidates) {
    if (c.shift === topCandidate.shift && safeText.trim().length > 0) {
      c.isTopCandidate = true;
    }
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const executionTimeMs = Math.max(0.01, endTime - startTime);

  const lettersOnly = safeText.replace(/[^a-zA-Z]/g, '');

  return {
    ciphertext: safeText,
    charCount: safeText.length,
    alphaCount: lettersOnly.length,
    totalCandidates: 26,
    executionTimeMs,
    candidates,
    topCandidate,
    keyspaceSize: 26,
    entropyBits: Math.log2(26), // ≈ 4.7004
  };
}

/**
 * Formats all 26 brute-force candidates into a plain-text cryptographic report for easy export/copying.
 */
export function formatBruteForceReport(analysis: BruteForceAnalysis): string {
  const header = [
    '======================================================================',
    '       CAESAR CIPHER EXHAUSTIVE BRUTE-FORCE CRYPTANALYSIS REPORT       ',
    '======================================================================',
    `Timestamp: ${new Date().toISOString()} (UTC)`,
    `Ciphertext: "${analysis.ciphertext}"`,
    `Payload Length: ${analysis.charCount} characters (${analysis.alphaCount} alphabetic)`,
    `Total Keyspace Exhausted: ${analysis.totalCandidates} permutations (k = 0 to 25)`,
    `Entropy: ~4.70 bits | Execution Time: ${analysis.executionTimeMs.toFixed(3)} ms`,
    'Notice: Educational cryptanalysis demonstration only. Zero external calls.',
    '======================================================================',
    '',
    'PERMUTATION MATRIX (ALL 26 CANDIDATE SHIFTS):',
    '----------------------------------------------------------------------',
  ];

  const rows = analysis.candidates.map((c) => {
    const shiftLabel = `Shift k=${c.shift.toString().padStart(2, '0')}`.padEnd(12, ' ');
    const tag = c.isTopCandidate
      ? ' [★ LIKELY PLAINTEXT]'
      : c.isRot13
      ? ' [ROT13]'
      : c.isOriginal
      ? ' [k=0 ORIGINAL]'
      : '';
    const scoreStr = `(Score: ${c.score.toString().padStart(4, ' ')})`;
    return `${shiftLabel} ${scoreStr}${tag}\n  -> "${c.candidatePlaintext}"`;
  });

  const footer = [
    '',
    '----------------------------------------------------------------------',
    `RECOMMENDED CANDIDATE: Shift k=${analysis.topCandidate.shift}`,
    `Recovered Plaintext: "${analysis.topCandidate.candidatePlaintext}"`,
    '======================================================================',
  ];

  return [...header, ...rows, ...footer].join('\n');
}

export const runBruteForceAnalysis = executeBruteForceAttack;

export const bruteForceService = {
  executeBruteForceAttack,
  runBruteForceAnalysis,
  calculateEnglishFitness,
  formatBruteForceReport,
  PRESET_CIPHERTEXTS,
};

export default bruteForceService;
