/**
 * @file runAllTests.ts
 * @description Standalone command-line test runner executing all Phase 1, Phase 2, Phase 4, Phase 5, and Phase 6 test suites.
 */

import { runCaesarCipherTests } from './caesarCipher.test';
import { runFoundationTests } from './foundation.test';
import { runUIWorkflowTests } from './uiWorkflow.test';
import { runDashboardTests } from './dashboard.test';
import { runAuthTests } from './auth.test';
import { runMessageHistoryTests } from './messageHistory.test';
import { runBruteForceTests } from './bruteForce.test';
import { runPWATests } from './pwa.test';
import { runIntegrationTests } from './integration.test';
import { runAndroidQATests } from './androidQA.test';
import { runShiftSyncTests } from './shiftSync.test';
import { runTacticalRadioPresetsTests } from './tacticalRadioPresets.test';
import { runAppLockRecoveryTests } from './appLockRecovery.test';
import { defaultApiClient } from '../services/apiClient';

async function main() {
  console.log('===============================================================');
  console.log('  SECURE COMMUNICATION - AUTOMATED TEST RUNNER');
  console.log('===============================================================\n');

  // Configure base URL for Node.js test environment against local dev server
  defaultApiClient.setBaseUrl('http://127.0.0.1:3000/api/v1');

  let totalPassed = 0;
  let totalFailed = 0;


  // Phase 1: Foundation Tests
  console.log('--- EXECUTING PHASE 1: FOUNDATION TESTS ---');
  const foundationResults = await runFoundationTests();
  for (const t of foundationResults) {
    if (t.passed) {
      console.log(`  [PASS] ${t.name}`);
      totalPassed++;
    } else {
      console.log(`  [FAIL] ${t.name}: ${t.error}`);
      totalFailed++;
    }
  }

  // Phase 2: Caesar Cipher Engine Tests
  console.log('\n--- EXECUTING PHASE 2: CAESAR CIPHER ENGINE TESTS ---');
  const caesarResults = runCaesarCipherTests();
  
  const categories: Record<string, typeof caesarResults> = {};
  for (const r of caesarResults) {
    if (!categories[r.category]) categories[r.category] = [];
    categories[r.category].push(r);
  }

  for (const [cat, tests] of Object.entries(categories)) {
    console.log(`\n  [Category: ${cat}]`);
    for (const t of tests) {
      if (t.passed) {
        totalPassed++;
        console.log(`    ✓ ${t.testName}`);
      } else {
        totalFailed++;
        console.log(`    ✗ ${t.testName} -> FAILED (${t.details})`);
      }
    }
  }

  // Phase 4: Encrypt / Decrypt UI Workflow & Edge Cases Tests
  console.log('\n--- EXECUTING PHASE 4: UI WORKFLOW & EDGE CASE TESTS ---');
  const workflowResults = runUIWorkflowTests();
  
  const wfCategories: Record<string, typeof workflowResults> = {};
  for (const r of workflowResults) {
    if (!wfCategories[r.category]) wfCategories[r.category] = [];
    wfCategories[r.category].push(r);
  }

  for (const [cat, tests] of Object.entries(wfCategories)) {
    console.log(`\n  [Category: ${cat}]`);
    for (const t of tests) {
      if (t.passed) {
        totalPassed++;
        console.log(`    ✓ ${t.testName}`);
      } else {
        totalFailed++;
        console.log(`    ✗ ${t.testName} -> FAILED (${t.details})`);
      }
    }
  }

  // Phase 5: Dashboard Tests
  console.log('\n--- EXECUTING PHASE 5: DASHBOARD TESTS ---');
  const dashboardResults = runDashboardTests();
  
  const dbCategories: Record<string, typeof dashboardResults> = {};
  for (const r of dashboardResults) {
    if (!dbCategories[r.category]) dbCategories[r.category] = [];
    dbCategories[r.category].push(r);
  }

  for (const [cat, tests] of Object.entries(dbCategories)) {
    console.log(`\n  [Category: ${cat}]`);
    for (const t of tests) {
      if (t.passed) {
        totalPassed++;
        console.log(`    ✓ ${t.testName}`);
      } else {
        totalFailed++;
        console.log(`    ✗ ${t.testName} -> FAILED (${t.details})`);
      }
    }
  }

  // Phase 6: Authentication Tests
  console.log('\n--- EXECUTING PHASE 6: AUTHENTICATION & SECURITY TESTS ---');
  const authResults = await runAuthTests();
  for (const t of authResults) {
    if (t.passed) {
      totalPassed++;
      console.log(`    ✓ ${t.name} (${t.durationMs}ms)`);
    } else {
      totalFailed++;
      console.log(`    ✗ ${t.name} -> FAILED (${t.message})`);
    }
  }

  // Phase 7: Authenticated Message History Vault Tests
  console.log('\n--- EXECUTING PHASE 7: MESSAGE HISTORY & VAULT TESTS ---');
  const messageHistoryResults = await runMessageHistoryTests();
  for (const t of messageHistoryResults) {
    if (t.passed) {
      totalPassed++;
      console.log(`    ✓ ${t.name} (${t.durationMs.toFixed(1)}ms)`);
    } else {
      totalFailed++;
      console.log(`    ✗ ${t.name} -> FAILED (${t.error})`);
    }
  }

  // Phase 8: Educational Brute-Force Attack Tests
  console.log('\n--- EXECUTING PHASE 8: BRUTE-FORCE ATTACK & RECOVERY TESTS ---');
  const bruteForceResults = runBruteForceTests();
  for (const t of bruteForceResults) {
    if (t.passed) {
      totalPassed++;
      console.log(`    ✓ [${t.category}] ${t.name} (${t.durationMs.toFixed(1)}ms)`);
    } else {
      totalFailed++;
      console.log(`    ✗ [${t.category}] ${t.name} -> FAILED (${t.error})`);
    }
  }

  // Phase 9: Progressive Web App & Offline Execution Tests
  console.log('\n--- EXECUTING PHASE 9: PROGRESSIVE WEB APP & OFFLINE TESTS ---');
  const pwaResults = runPWATests();
  for (const t of pwaResults) {
    if (t.passed) {
      totalPassed++;
      console.log(`    ✓ [${t.category}] ${t.name} (${t.durationMs.toFixed(1)}ms)`);
    } else {
      totalFailed++;
      console.log(`    ✗ [${t.category}] ${t.name} -> FAILED (${t.error})`);
    }
  }

  // Phase 11: Full Integration & End-to-End Workflow Tests
  console.log('\n--- EXECUTING PHASE 11: FULL INTEGRATION & E2E WORKFLOW TESTS ---');
  const integrationResults = await runIntegrationTests();
  for (const t of integrationResults) {
    if (t.passed) {
      totalPassed++;
      console.log(`    ✓ [${t.category}] ${t.name} (${t.durationMs.toFixed(1)}ms)`);
    } else {
      totalFailed++;
      console.log(`    ✗ [${t.category}] ${t.name} -> FAILED (${t.error})`);
    }
  }

  // Phase 15: Android QA & Native Platform Review Tests
  console.log('\n--- EXECUTING PHASE 15: ANDROID QA & NATIVE PLATFORM REVIEW TESTS ---');
  const androidResults = await runAndroidQATests();
  for (const t of androidResults) {
    if (t.passed) {
      totalPassed++;
      console.log(`    ✓ [${t.category}] ${t.name} (${t.durationMs.toFixed(1)}ms)`);
    } else {
      totalFailed++;
      console.log(`    ✗ [${t.category}] ${t.name} -> FAILED (${t.error})`);
    }
  }

  // Phase 16: Caesar Shift State Synchronization Tests
  console.log('\n--- EXECUTING PHASE 16: CAESAR SHIFT SYNCHRONIZATION TESTS ---');
  const shiftSyncResults = runShiftSyncTests();
  for (const t of shiftSyncResults) {
    if (t.passed) {
      totalPassed++;
      console.log(`    ✓ [${t.category}] ${t.testName}`);
    } else {
      totalFailed++;
      console.log(`    ✗ [${t.category}] ${t.testName} -> FAILED (${t.details})`);
    }
  }

  // Phase 17: Tactical Radio Presets & Simulator Tests
  console.log('\n--- EXECUTING PHASE 17: TACTICAL RADIO PRESETS & SIMULATOR TESTS ---');
  const presetResults = await runTacticalRadioPresetsTests();
  for (const t of presetResults) {
    if (t.passed) {
      totalPassed++;
      console.log(`    ✓ [${t.category}] ${t.name} (${t.durationMs.toFixed(1)}ms)`);
    } else {
      totalFailed++;
      console.log(`    ✗ [${t.category}] ${t.name} -> FAILED (${t.message})`);
    }
  }

  // Phase 18: App Lock 6-Digit PIN Recovery & Reset Tests
  console.log('\n--- EXECUTING PHASE 18: APP LOCK 6-DIGIT PIN RECOVERY & RESET TESTS ---');
  const recoveryResults = await runAppLockRecoveryTests();
  for (const t of recoveryResults) {
    if (t.passed) {
      totalPassed++;
      console.log(`    ✓ [${t.category}] ${t.name} (${t.durationMs.toFixed(1)}ms)`);
    } else {
      totalFailed++;
      console.log(`    ✗ [${t.category}] ${t.name} -> FAILED (${t.message})`);
    }
  }

  console.log('\n===============================================================');
  console.log(`  TOTAL TESTS: ${totalPassed + totalFailed} | PASSED: ${totalPassed} | FAILED: ${totalFailed}`);
  console.log('===============================================================');

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    console.log('\n  >> ALL TEST SUITES (PHASES 1-11) PASSED SUCCESSFULLY (ZERO FAILURES).\n');
  }
}

main().catch((err) => {
  console.error('Fatal error during test execution:', err);
  process.exit(1);
});
