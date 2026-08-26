/**
 * @file dashboard.test.ts
 * @description Unit test suite for Phase 5: Dashboard metrics, state store, quick actions, and recent activity feed.
 */

import {
  getOperationStats,
  getRecentActivities,
  getSelectedShift,
  setSelectedShift,
  logOperation,
  clearActivityLog,
  resetToDemoActivity,
  OperationActivity,
  OperationStats,
} from '../services/activityStore';
import { encrypt, decrypt } from '../services/caesarCipher';

export interface DashboardTestResult {
  suite: string;
  testName: string;
  category: 'Stats & Metrics' | 'Shift State' | 'Quick Actions' | 'Activity Feed' | 'State Reset';
  passed: boolean;
  details?: string;
}

export function runDashboardTests(): DashboardTestResult[] {
  const results: DashboardTestResult[] = [];

  function assert(
    testName: string,
    category: DashboardTestResult['category'],
    condition: boolean,
    details?: string
  ) {
    results.push({
      suite: 'Phase 5 Dashboard Suite',
      testName,
      category,
      passed: condition,
      details: condition ? undefined : details || 'Assertion failed',
    });
  }

  // --- 1. Stats & Metrics ---
  resetToDemoActivity();
  const initStats = getOperationStats();
  assert(
    'Initial dashboard state returns non-negative stats',
    'Stats & Metrics',
    initStats.totalEncryptions >= 0 &&
      initStats.totalDecryptions >= 0 &&
      initStats.totalOperations === initStats.totalEncryptions + initStats.totalDecryptions
  );

  const prevEnc = initStats.totalEncryptions;
  const prevDec = initStats.totalDecryptions;
  const prevTotal = initStats.totalOperations;

  // Log Encryption
  logOperation('ENCRYPT', 3, 'HELLO DASHBOARD', 'KHOOR GDVKERDUG', 'Test Encrypt');
  const afterEncStats = getOperationStats();
  assert(
    'Logging encryption increments totalEncryptions and totalOperations by 1',
    'Stats & Metrics',
    afterEncStats.totalEncryptions === prevEnc + 1 &&
      afterEncStats.totalOperations === prevTotal + 1 &&
      afterEncStats.totalDecryptions === prevDec
  );

  // Log Decryption
  logOperation('DECRYPT', 3, 'KHOOR GDVKERDUG', 'HELLO DASHBOARD', 'Test Decrypt');
  const afterDecStats = getOperationStats();
  assert(
    'Logging decryption increments totalDecryptions and totalOperations by 1',
    'Stats & Metrics',
    afterDecStats.totalDecryptions === prevDec + 1 &&
      afterDecStats.totalOperations === prevTotal + 2 &&
      afterDecStats.totalEncryptions === afterEncStats.totalEncryptions
  );

  // --- 2. Shift State Management ---
  setSelectedShift(7);
  assert(
    'Setting selected shift to 7 updates current shift',
    'Shift State',
    getSelectedShift() === 7
  );

  setSelectedShift(13);
  assert(
    'Setting selected shift to 13 (ROT13) updates current shift',
    'Shift State',
    getSelectedShift() === 13
  );

  setSelectedShift(29); // 29 mod 26 = 3
  assert(
    'Setting out-of-range shift 29 normalizes to k=3',
    'Shift State',
    getSelectedShift() === 3
  );

  setSelectedShift(-3); // -3 mod 26 = 23
  assert(
    'Setting negative shift -3 normalizes to k=23',
    'Shift State',
    getSelectedShift() === 23
  );

  // Reset to Caesar shift 3
  setSelectedShift(3);

  // --- 3. Quick Actions ---
  const quickPlain = 'TACTICAL RECON MISSION 2026';
  const quickShift = 5;
  const quickEncOutput = encrypt(quickPlain, quickShift);
  assert(
    'Quick Encrypt produces correct ciphertext for given shift',
    'Quick Actions',
    quickEncOutput === 'YFHYNHFQ WJHTS RNXXNTS 2026'
  );

  const quickDecOutput = decrypt(quickEncOutput, quickShift);
  assert(
    'Quick Decrypt faithfully inverts the quick ciphertext back to original plaintext',
    'Quick Actions',
    quickDecOutput === quickPlain
  );

  // --- 4. Activity Feed Logging & Snippets ---
  const longInput = 'A'.repeat(120);
  const loggedAct = logOperation('ENCRYPT', 4, longInput, 'E'.repeat(120), 'Large payload test');
  const activities = getRecentActivities();

  assert(
    'New activity item is prepended at index 0 of recent activities',
    'Activity Feed',
    activities.length > 0 && activities[0].id === loggedAct.id
  );

  assert(
    'Long inputs in activity feed are truncated to snippet length with ellipsis',
    'Activity Feed',
    loggedAct.inputSnippet.endsWith('...') && loggedAct.inputSnippet.length <= 80
  );

  assert(
    'Activity record maintains exact character length metadata for full payload inspection',
    'Activity Feed',
    loggedAct.inputLength === 120 && loggedAct.outputLength === 120
  );

  // --- 5. State Reset & Clear ---
  clearActivityLog();
  const clearedStats = getOperationStats();
  const clearedActivities = getRecentActivities();
  assert(
    'clearActivityLog resets all operation counters to zero',
    'State Reset',
    clearedStats.totalEncryptions === 0 &&
      clearedStats.totalDecryptions === 0 &&
      clearedStats.totalOperations === 0
  );

  assert(
    'clearActivityLog empties the recent activities list',
    'State Reset',
    clearedActivities.length === 0
  );

  resetToDemoActivity();
  const restoredStats = getOperationStats();
  const restoredActivities = getRecentActivities();
  assert(
    'resetToDemoActivity restores pre-seeded demo telemetry and activity entries',
    'State Reset',
    restoredStats.totalOperations > 0 && restoredActivities.length > 0
  );

  return results;
}
