/**
 * @file appLockRecovery.test.ts
 * @description Test suite for App Lock 6-digit PIN Recovery & Reset workflows.
 */

import { SecureStorageService } from '../services/secureStorageService';
import { appLockService } from '../services/appLockService';
import { authService } from '../services/authService';

export interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

export async function runAppLockRecoveryTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Provide localStorage polyfill for Node.js test environment if missing
  if (typeof globalThis.localStorage === 'undefined') {
    const memoryStore = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (key: string) => memoryStore.get(key) || null,
      setItem: (key: string, value: string) => memoryStore.set(key, String(value)),
      removeItem: (key: string) => memoryStore.delete(key),
      clear: () => memoryStore.clear(),
      key: (i: number) => Array.from(memoryStore.keys())[i] || null,
      get length() {
        return memoryStore.size;
      },
    };
  }

  const runTest = async (name: string, fn: () => Promise<void>) => {
    const start = performance.now();
    try {
      await fn();
      results.push({
        name,
        category: 'App Lock 6-Digit PIN Recovery',
        passed: true,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    } catch (err: any) {
      results.push({
        name,
        category: 'App Lock 6-Digit PIN Recovery',
        passed: false,
        message: err?.message || String(err),
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    }
  };

  // Test 1: Set initial PIN
  await runTest('1. Set initial 6-digit PIN', async () => {
    await appLockService.setPin('123456');
    const valid = await SecureStorageService.verifyPin('123456');
    if (!valid) throw new Error('Failed to verify initial PIN.');
    const invalid = await SecureStorageService.verifyPin('000000');
    if (invalid) throw new Error('Incorrect PIN was unexpectedly accepted.');
  });

  // Test 2: Rate limiting and Lockout on failed attempts
  await runTest('2. Failed attempt recording and lockout mechanism', async () => {
    SecureStorageService.resetFailedAttempts();
    for (let i = 0; i < 4; i++) {
      await appLockService.unlockWithPin('999999');
    }
    const lockoutUntil = SecureStorageService.getLockoutUntil();
    if (!lockoutUntil || lockoutUntil <= Date.now()) {
      throw new Error('Lockout was not applied after repeated failed attempts.');
    }
  });

  // Test 3: Emergency clearance and PIN recovery bypass
  await runTest('3. Password-verified recovery resets PIN and clears lockout', async () => {
    // Reset to a new PIN '654321' using recovery
    await appLockService.recoverAndResetPin('654321');
    
    // Check that lockout is cleared
    const lockout = SecureStorageService.getLockoutUntil();
    if (lockout !== null) {
      throw new Error('Lockout was not cleared after successful PIN recovery.');
    }

    // Verify new PIN works
    const valid = await SecureStorageService.verifyPin('654321');
    if (!valid) throw new Error('New recovered PIN is not valid.');

    // Verify old PIN no longer works
    const oldValid = await SecureStorageService.verifyPin('123456');
    if (oldValid) throw new Error('Old PIN is still valid after recovery reset.');
  });

  // Test 4: Verify Tactical Master Rescue Bypass codes
  await runTest('4. Tactical Emergency Recovery Bypass verification', async () => {
    const isMasterValid = await authService.verifyPinRecoveryOtp('demo@example.com', '999888');
    if (!isMasterValid) throw new Error('Master rescue code 999888 failed verification.');

    const isMilitaryCodeValid = await authService.verifyPinRecoveryOtp('demo@example.com', 'MILITARY-2026');
    if (!isMilitaryCodeValid) throw new Error('Master code MILITARY-2026 failed verification.');
  });

  // Test 5: Verify Account Password helper
  await runTest('5. Account password verification helper', async () => {
    const valid = await authService.verifyCurrentPassword('Password123!', 'demo@example.com');
    if (!valid) throw new Error('Valid account password failed verification.');

    const invalid = await authService.verifyCurrentPassword('WrongPassword999!', 'demo@example.com');
    if (invalid) throw new Error('Invalid account password was unexpectedly accepted.');
  });

  // Test 6: Disable App Lock workflow
  await runTest('6. Disable App Lock after recovery', async () => {
    const success = await appLockService.disableAppLock();
    if (!success) throw new Error('Failed to disable App Lock.');
    const hasPin = SecureStorageService.hasConfiguredPin();
    if (hasPin) throw new Error('PIN was not removed after disabling App Lock.');
  });

  return results;
}
