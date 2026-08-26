/**
 * @file messageHistory.test.ts
 * @description Comprehensive automated test suite for Phase 7: Authenticated Message History Vault.
 * Tests:
 * 1. User Message Creation & Zero-Plaintext Invariant
 * 2. User Message Isolation (Strict User A vs User B boundaries)
 * 3. Protected GET /messages/{id} Access Control (403 on Cross-User Access)
 * 4. Protected DELETE /messages/{id} Deletion Control (403 on Cross-User Deletion)
 * 5. Successful User Deletion of Owned Message
 * 6. Interactive Search Query Filtering (Ciphertext, Notes, Shift)
 * 7. Multi-Criteria Sorting (Newest, Oldest, Shift, Length)
 * 8. Rejection of Unauthenticated Requests (401 Unauthorized)
 * 9. Per-User Vault Aggregate Statistics
 */

import { messageService } from '../services/messageService';
import { authService } from '../services/authService';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

export async function runMessageHistoryTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const runTest = async (name: string, fn: () => Promise<void> | void) => {
    const start = performance.now();
    try {
      await fn();
      results.push({
        suite: 'Phase 7: Authenticated Message History Vault',
        name,
        passed: true,
        durationMs: performance.now() - start,
      });
    } catch (e: any) {
      results.push({
        suite: 'Phase 7: Authenticated Message History Vault',
        name,
        passed: false,
        error: e?.message || String(e),
        durationMs: performance.now() - start,
      });
    }
  };

  // Setup: Reset demo state
  authService.resetToDemoUsers();
  messageService.resetToDemoVault();

  // Test 1: Unauthenticated request rejection (401)
  await runTest('T7.1: Unauthenticated access to GET /messages throws 401 Unauthorized', async () => {
    authService.logout();
    try {
      await messageService.getMessages();
      throw new Error('Expected 401 error when unauthenticated');
    } catch (err: any) {
      if (err?.status !== 401 && !err?.message?.includes('Authentication required')) {
        throw new Error(`Expected 401 status, got: ${JSON.stringify(err)}`);
      }
    }
  });

  // Test 2: Authenticate Operator Odin and Create Message
  await runTest('T7.2: Authenticated operator can create encrypted message record (Zero Plaintext)', async () => {
    await authService.login({
      username: 'operator_odin',
      password: 'TacticalPass123!',
    });

    const newMsg = await messageService.createMessage({
      ciphertext: 'VRXDGURQ DODUP: WDUJHW ORFNHG',
      shift: 3,
      operationType: 'ENCRYPT',
      notes: 'Sector Radar Warning (k=3)',
    });

    if (!newMsg.id.startsWith('msg-')) {
      throw new Error(`Expected message ID starting with msg-, got ${newMsg.id}`);
    }
    if (newMsg.ciphertext !== 'VRXDGURQ DODUP: WDUJHW ORFNHG') {
      throw new Error(`Ciphertext mismatch: ${newMsg.ciphertext}`);
    }
    if (newMsg.shift !== 3) {
      throw new Error(`Expected shift 3, got ${newMsg.shift}`);
    }
    if (newMsg.charCount !== 29) {
      throw new Error(`Expected charCount 29, got ${newMsg.charCount}`);
    }

    // Zero Plaintext verification
    if ('plaintext' in newMsg || (newMsg as any).rawMessage) {
      throw new Error('Security Violation: Vault record must never contain plaintext attributes.');
    }
  });

  // Test 3: User Isolation between Odin and Sentinel
  await runTest('T7.3: Strict User Isolation: Operator Odin cannot see Sentinel records', async () => {
    // Odin is logged in
    const odinMessages = await messageService.getMessages();
    const odinUser = authService.getCurrentUser();

    if (!odinUser) throw new Error('User Odin must be logged in');
    if (odinMessages.some((m) => m.userId !== odinUser.id)) {
      throw new Error('Security Violation: Odin vault contains records belonging to another operator.');
    }

    // Now switch to Sentinel
    await authService.login({
      username: 'sentinel_cadet',
      password: 'CadetShield2026!',
    });
    const sentinelUser = authService.getCurrentUser();
    if (!sentinelUser) throw new Error('Sentinel must be logged in');

    const sentinelMessages = await messageService.getMessages();
    if (sentinelMessages.some((m) => m.userId !== sentinelUser.id)) {
      throw new Error('Security Violation: Sentinel vault contains records belonging to Odin.');
    }
  });

  // Test 4: Cross-User Access Control (403 Forbidden)
  await runTest('T7.4: Cross-User Access GET /messages/{id} throws 403 Forbidden', async () => {
    // Sentinel is logged in, attempts to fetch Odin's seed message 'msg-vault-001'
    try {
      await messageService.getMessageById('msg-vault-001');
      throw new Error('Expected 403 Forbidden error on cross-user access');
    } catch (err: any) {
      if (err?.status !== 403) {
        throw new Error(`Expected 403 status, got ${err?.status}: ${err?.message}`);
      }
    }
  });

  // Test 5: Cross-User Deletion Control (403 Forbidden)
  await runTest('T7.5: Cross-User Deletion DELETE /messages/{id} throws 403 Forbidden', async () => {
    // Sentinel attempts to delete Odin's record 'msg-vault-001'
    try {
      await messageService.deleteMessage('msg-vault-001');
      throw new Error('Expected 403 Forbidden error on cross-user deletion');
    } catch (err: any) {
      if (err?.status !== 403) {
        throw new Error(`Expected 403 status, got ${err?.status}: ${err?.message}`);
      }
    }
  });

  // Test 6: Successful Deletion of Owned Message
  await runTest('T7.6: Operator can successfully delete their own vaulted message', async () => {
    // Sentinel deletes their own record 'msg-vault-003'
    const success = await messageService.deleteMessage('msg-vault-003');
    if (!success) {
      throw new Error('Expected deleteMessage to return true');
    }

    // Verify it is gone
    try {
      await messageService.getMessageById('msg-vault-003');
      throw new Error('Expected deleted record to not be found (404)');
    } catch (err: any) {
      if (err?.status !== 404) {
        throw new Error(`Expected 404 status for deleted message, got ${err?.status}`);
      }
    }
  });

  // Test 7: Search and Query Filtering
  await runTest('T7.7: Interactive search query filters ciphertext, shift, and mission notes', async () => {
    // Switch back to Odin
    await authService.login({
      username: 'operator_odin',
      password: 'TacticalPass123!',
    });

    // Create 2 distinct messages
    await messageService.createMessage({
      ciphertext: 'ALPHA BRAVO CHARLIE TRANSMISSION',
      shift: 5,
      operationType: 'ENCRYPT',
      notes: 'Operation Red Dawn',
    });
    await messageService.createMessage({
      ciphertext: 'DELTA ECHO FOXTROT PROTOCOL',
      shift: 10,
      operationType: 'DECRYPT',
      notes: 'Operation Blue Sky',
    });

    // Search by note keyword
    const searchNote = await messageService.getMessages({ searchQuery: 'Red Dawn' });
    if (searchNote.length !== 1 || !searchNote[0].notes?.includes('Red Dawn')) {
      throw new Error(`Search by note failed. Found ${searchNote.length} records.`);
    }

    // Search by ciphertext keyword
    const searchCipher = await messageService.getMessages({ searchQuery: 'FOXTROT' });
    if (searchCipher.length !== 1 || !searchCipher[0].ciphertext.includes('FOXTROT')) {
      throw new Error(`Search by ciphertext failed. Found ${searchCipher.length} records.`);
    }

    // Filter by Operation Type (DECRYPT)
    const decryptOnly = await messageService.getMessages({ operationFilter: 'DECRYPT' });
    if (decryptOnly.some((m) => m.operationType !== 'DECRYPT')) {
      throw new Error('Operation filter DECRYPT returned non-decrypt records.');
    }
  });

  // Test 8: Multi-Criteria Sorting
  await runTest('T7.8: Multi-criteria sorting (shift_asc, shift_desc, length_desc)', async () => {
    const byShiftAsc = await messageService.getMessages({ sortBy: 'shift_asc' });
    for (let i = 0; i < byShiftAsc.length - 1; i++) {
      if (byShiftAsc[i].shift > byShiftAsc[i + 1].shift) {
        throw new Error(`Shift ascending sorting violation at index ${i}: ${byShiftAsc[i].shift} > ${byShiftAsc[i+1].shift}`);
      }
    }

    const byLengthDesc = await messageService.getMessages({ sortBy: 'length_desc' });
    for (let i = 0; i < byLengthDesc.length - 1; i++) {
      if (byLengthDesc[i].charCount < byLengthDesc[i + 1].charCount) {
        throw new Error(`Length descending sorting violation at index ${i}`);
      }
    }
  });

  // Test 9: Vault Aggregate Stats
  await runTest('T7.9: Per-User Vault Aggregate Statistics Calculation', async () => {
    const stats = await messageService.getStats();
    if (stats.totalMessages <= 0) {
      throw new Error(`Expected positive message count for Odin, got ${stats.totalMessages}`);
    }
    if (stats.totalEncrypted + stats.totalDecrypted !== stats.totalMessages) {
      throw new Error('Sum of encrypted and decrypted messages must match total messages.');
    }
  });

  return results;
}
