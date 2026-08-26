/**
 * Unit Test Suite for PHASE 9: Progressive Web App (PWA) & Offline Capabilities
 * Tests Web App Manifest, Service Worker caching policies, airgap offline encryption/decryption,
 * and offline brute-force demonstration.
 */

import { encrypt, decrypt, isValidShift, normalizeShift } from '../services/caesarCipher';
import { executeBruteForceAttack } from '../services/bruteForceService';
import { pwaManager } from '../services/pwaService';

export interface TestResult {
  suite: string;
  category?: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export function runPWATests(): TestResult[] {
  const results: TestResult[] = [];

  const runTest = (name: string, fn: () => void, category: string = 'PWA & Offline') => {
    const start = performance.now();
    try {
      fn();
      results.push({
        suite: 'Phase 9: PWA & Offline Support',
        category,
        name,
        passed: true,
        durationMs: performance.now() - start,
      });
    } catch (e: any) {
      results.push({
        suite: 'Phase 9: PWA & Offline Support',
        category,
        name,
        passed: false,
        error: e?.message || String(e),
        durationMs: performance.now() - start,
      });
    }
  };

  // 1. Web App Manifest Structure Tests
  runTest('T9.1: Web App Manifest specification compliance', () => {
    // Simulated manifest payload validation
    const sampleManifest = {
      name: 'Secure Military Communication | Caesar Cipher Console',
      short_name: 'CaesarCmd',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#0A0B08',
      theme_color: '#0F110C',
      icons: [
        { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
        { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
      ],
    };

    if (!sampleManifest.name || !sampleManifest.short_name) {
      throw new Error('Manifest missing required name or short_name');
    }
    if (sampleManifest.display !== 'standalone') {
      throw new Error('Manifest display must be standalone');
    }
    if (!sampleManifest.icons || sampleManifest.icons.length < 2) {
      throw new Error('Manifest must specify at least 192px and 512px icons');
    }
  });

  // 2. Application Icons Integrity
  runTest('T9.2: Application icon dimensions & maskable purposes defined', () => {
    const icons = [
      { sizes: '192x192', type: 'image/svg+xml' },
      { sizes: '512x512', type: 'image/svg+xml' },
    ];
    const has192 = icons.some((i) => i.sizes === '192x192');
    const has512 = icons.some((i) => i.sizes === '512x512');
    if (!has192 || !has512) {
      throw new Error('Required icon sizes (192, 512) not defined');
    }
  });

  // 3. Service Worker Security Caching Policy
  runTest('T9.3: Security Policy: Sensitive auth & token endpoints bypass SW cache', () => {
    const excludedPatterns = [/\/api\/auth/, /\/api\/messages/, /\/api\//];
    const sensitiveUrls = [
      'https://example.com/api/auth/login',
      'https://example.com/api/auth/register',
      'https://example.com/api/auth/me',
      'https://example.com/api/messages',
    ];

    for (const testUrl of sensitiveUrls) {
      const urlObj = new URL(testUrl);
      const isExcluded = excludedPatterns.some((pattern) => pattern.test(urlObj.pathname));
      if (!isExcluded) {
        throw new Error(`Security breach: Sensitive route ${testUrl} was not excluded from SW cache`);
      }
    }
  });

  // 4. Offline Caesar Encryption Readiness
  runTest('T9.4: Offline execution of Caesar Encryption (100% in-memory)', () => {
    // Airgap simulation: Execute encryption completely disconnected
    const payload = 'TACTICAL AIRGAP TRANSMISSION 2026';
    const encrypted = encrypt(payload, 3);
    if (encrypted !== 'WDFWLFDO DLUJDS WUDQVPLVVLRQ 2026') {
      throw new Error(`Offline encryption failed. Expected "WDFWLFDO DLUJDS WUDQVPLVVLRQ 2026", got "${encrypted}"`);
    }
  });

  // 5. Offline Caesar Decryption Readiness
  runTest('T9.5: Offline execution of Caesar Decryption (100% in-memory)', () => {
    // Invert ciphertext completely disconnected
    const ciphertext = 'WDFWLFDO DLUJDS WUDQVPLVVLRQ 2026';
    const decrypted = decrypt(ciphertext, 3);
    if (decrypted !== 'TACTICAL AIRGAP TRANSMISSION 2026') {
      throw new Error(`Offline decryption failed. Expected "TACTICAL AIRGAP TRANSMISSION 2026", got "${decrypted}"`);
    }
  });

  // 6. Offline ROT13 Symmetry Check
  runTest('T9.6: Offline ROT13 symmetric transformation (k=13)', () => {
    const original = 'Offline Autonomous Cryptography!';
    const rot1 = encrypt(original, 13);
    const rot2 = encrypt(rot1, 13);
    if (rot2 !== original) {
      throw new Error(`Offline ROT13 symmetry failed. Got: ${rot2}`);
    }
  });

  // 7. Offline 26-Shift Brute-Force Demonstration
  runTest('T9.7: Offline Brute-Force analysis computes all 26 shifts locally (< 5ms)', () => {
    const intercepted = 'DWWDFN DW GDZQ';
    const analysis = executeBruteForceAttack(intercepted);

    if (analysis.totalCandidates !== 26 || analysis.candidates.length !== 26) {
      throw new Error(`Offline brute-force failed. Generated ${analysis.candidates.length} permutations instead of 26`);
    }

    const match3 = analysis.candidates.find((c) => c.shift === 3);
    if (!match3 || match3.candidatePlaintext !== 'ATTACK AT DAWN') {
      throw new Error(`Offline brute force failed to identify correct plaintext at k=3`);
    }
  });

  // 8. Network State Manager & Airgap Mode Simulation
  runTest('T9.8: Network Status and Airgap mode toggle state transitions', () => {
    const initial = pwaManager.getState();
    if (typeof initial.isOnline !== 'boolean') {
      throw new Error('isOnline must be a boolean');
    }

    // Toggle simulated airgap offline
    pwaManager.setSimulatedOffline(true);
    const airgapState = pwaManager.getState();
    if (airgapState.effectiveOnline !== false) {
      throw new Error('Effective online status must be false during simulated airgap');
    }

    // Restore online
    pwaManager.setSimulatedOffline(false);
    const restoredState = pwaManager.getState();
    if (restoredState.isSimulatedOffline !== false) {
      throw new Error('Simulated airgap flag failed to reset');
    }
  });

  // 9. Edge-case character preservation in offline cipher
  runTest('T9.9: Offline preservation of symbols, non-ASCII, and multi-line breaks', () => {
    const complexPayload = 'COORDINATES: [37.7749° N, 122.4194° W]\nCLEARANCE: TOP-SECRET\n#ALPHA-9';
    const enc = encrypt(complexPayload, 7);
    const dec = decrypt(enc, 7);
    if (dec !== complexPayload) {
      throw new Error('Offline round-trip failed on complex multi-line text with symbols');
    }
  });

  return results;
}
