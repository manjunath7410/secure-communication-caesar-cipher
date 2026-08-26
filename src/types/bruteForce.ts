/**
 * @file bruteForce.ts
 * @description Type definitions for Phase 8: Brute-Force Attack Demonstration.
 */

export interface BruteForceCandidate {
  shift: number;
  candidatePlaintext: string;
  isOriginal: boolean;
  isRot13: boolean;
  score: number; // English frequency heuristic score (higher = more likely English)
  wordMatches: string[];
  isTopCandidate?: boolean;
}

export interface BruteForceAnalysis {
  ciphertext: string;
  charCount: number;
  alphaCount: number;
  totalCandidates: number; // Always 26
  executionTimeMs: number;
  candidates: BruteForceCandidate[];
  topCandidate: BruteForceCandidate;
  keyspaceSize: number; // 26
  entropyBits: number; // log2(26) ≈ 4.7004 bits
}

export interface PresetCiphertext {
  id: string;
  label: string;
  ciphertext: string;
  knownShift: number;
  description: string;
}
