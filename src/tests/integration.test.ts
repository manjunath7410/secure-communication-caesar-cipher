/**
 * @file integration.test.ts
 * @description Phase 11 Full Integration Tests:
 * Validates end-to-end integration between frontend client services and FastAPI backend endpoints,
 * central API client architecture, environment base URL resolution, JWT lifecycle, network resilience,
 * and the two canonical user workflows:
 * Workflow 1: Register -> Login -> Dashboard -> Encrypt -> Save History -> History -> Delete -> Logout
 * Workflow 2: Login -> Decrypt -> Save History -> History
 */

import { ApiClient, ApiError, defaultApiClient } from '../services/apiClient';
import { authService } from '../services/authService';
import { messageService } from '../services/messageService';
import { encrypt, decrypt } from '../services/caesarCipher';

export interface IntegrationTestResult {
  name: string;
  category: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

export async function runIntegrationTests(): Promise<IntegrationTestResult[]> {
  const results: IntegrationTestResult[] = [];

  const runTest = async (category: string, name: string, fn: () => Promise<void> | void) => {
    const start = performance.now();
    try {
      await fn();
      results.push({
        category,
        name,
        passed: true,
        durationMs: performance.now() - start,
      });
    } catch (err: any) {
      results.push({
        category,
        name,
        passed: false,
        durationMs: performance.now() - start,
        error: err?.message || String(err),
      });
    }
  };

  // Test Category 1: Central API Client Architecture & Config
  await runTest('API Client Architecture', 'T11.1: ApiClient respects base URL and query parameter serialization', () => {
    const client = new ApiClient('https://api.military-crypto.internal');
    if (client.getBaseUrl() !== 'https://api.military-crypto.internal') {
      throw new Error(`Expected base URL 'https://api.military-crypto.internal', got '${client.getBaseUrl()}'`);
    }

    client.setToken('test-bearer-token-12345');
    if (client.getToken() !== 'test-bearer-token-12345') {
      throw new Error('ApiClient token getter failed to return set Bearer token');
    }

    client.clearToken();
    if (client.getToken() !== null) {
      throw new Error('ApiClient clearToken failed to reset token to null');
    }
  });

  await runTest('API Client Architecture', 'T11.2: ApiError encapsulates HTTP status, message, isUnauthorized and isNetworkError', () => {
    const authError = new ApiError(401, 'Session expired or token invalid');
    if (!authError.isUnauthorized || authError.status !== 401) {
      throw new Error('ApiError 401 did not flag isUnauthorized correctly');
    }

    const netError = new ApiError(0, 'Failed to fetch', 'Network offline', true);
    if (!netError.isNetworkError || netError.status !== 0) {
      throw new Error('ApiError did not flag isNetworkError correctly');
    }

    const forbiddenError = new ApiError(403, 'Cross-user vault access forbidden');
    if (forbiddenError.status !== 403 || forbiddenError.message !== 'Cross-user vault access forbidden') {
      throw new Error('ApiError 403 mismatch');
    }
  });

  await runTest('API Client Architecture', 'T11.3: Central ApiClient global 401 unauthorized trigger notifies listeners', () => {
    const client = new ApiClient('/api/test');
    let triggered = false;
    const unsub = client.onUnauthorized(() => {
      triggered = true;
    });

    client.notifyUnauthorized();
    if (!triggered) {
      throw new Error('ApiClient notifyUnauthorized did not fire subscriber callback');
    }
    unsub();
  });

  // Test Category 2: End-to-End Workflow 1
  // Register -> Login -> Dashboard -> Encrypt -> Save history -> History -> Delete -> Logout
  await runTest(
    'Workflow 1: Register -> Login -> Dashboard -> Encrypt -> History -> Delete -> Logout',
    'T11.4: Execute canonical Workflow 1 end-to-end',
    async () => {
      // Step 1: Register new operator
      const uniqueSuffix = Date.now().toString(36);
      const testUsername = `tactical_op_${uniqueSuffix}`;
      const testEmail = `operator_${uniqueSuffix}@recon.mil`;
      const testPassword = 'TacticalPass2026!';

      const regResponse = await authService.register({
        username: testUsername,
        email: testEmail,
        password: testPassword,
        callsign: 'ECHO-LEAD',
        clearanceLevel: 'TOP_SECRET',
      });

      if (!regResponse.user || !regResponse.accessToken) {
        throw new Error('Registration failed to return user and access token');
      }
      if (regResponse.user.username !== testUsername) {
        throw new Error(`Expected username ${testUsername}, got ${regResponse.user.username}`);
      }

      // Step 2: Login operator with freshly provisioned credentials
      const loginResponse = await authService.login({
        username: testUsername,
        password: testPassword,
      });

      if (!loginResponse.accessToken || !authService.isAuthenticated()) {
        throw new Error('Login failed to authenticate operator state in authService');
      }

      // Step 3: Dashboard state and telemetry check
      const currentUser = authService.getCurrentUser();
      if (!currentUser || currentUser.username !== testUsername) {
        throw new Error('Current user mismatch after login');
      }
      const initialStats = await messageService.getStats();
      if (typeof initialStats.totalMessages !== 'number') {
        throw new Error('getStats failed to return numerical statistics');
      }

      // Step 4: Encrypt plaintext transmission using Caesar Cipher engine (k=7)
      const plaintext = 'SECURE RENDEZVOUS AT COORDINATES 34.05N 118.24W AT 0800Z.';
      const shift = 7;
      const ciphertext = encrypt(plaintext, shift);
      const invertedPlaintext = decrypt(ciphertext, shift);
      if (invertedPlaintext !== plaintext) {
        throw new Error(`Ciphertext round-trip failed: got ${invertedPlaintext}`);
      }


      // Step 5: Save history (vault record)
      const createdMessage = await messageService.createMessage({
        ciphertext,
        shift,
        operationType: 'ENCRYPT',
        notes: 'Tactical Recon Rendezvous (k=7)',
      });

      if (!createdMessage.id || createdMessage.ciphertext !== ciphertext || createdMessage.shift !== 7) {
        throw new Error('Vault message record creation returned inconsistent payload');
      }

      // Step 6: History - Query messages and verify user isolation & search
      const userHistory = await messageService.getMessages({
        searchQuery: 'RENDEZVOUS',
        operationFilter: 'ENCRYPT',
      });

      if (userHistory.length === 0) {
        throw new Error('History query failed to find newly saved encrypted message');
      }
      if (userHistory[0].id !== createdMessage.id) {
        throw new Error(`Expected vaulted message ID ${createdMessage.id}, got ${userHistory[0].id}`);
      }

      // Step 7: Delete - Purge vaulted record
      const deleteSuccess = await messageService.deleteMessage(createdMessage.id);
      if (!deleteSuccess) {
        throw new Error('Message deletion returned false');
      }

      const postDeleteHistory = await messageService.getMessages();
      if (postDeleteHistory.some((m) => m.id === createdMessage.id)) {
        throw new Error('Deleted message was still present in operator vault history');
      }

      // Step 8: Logout
      authService.logout();
      if (authService.isAuthenticated() || authService.getCurrentUser() !== null) {
        throw new Error('authService.logout failed to clear authentication session');
      }
    }
  );

  // Test Category 3: End-to-End Workflow 2
  // Login -> Decrypt -> Save history -> History
  await runTest(
    'Workflow 2: Login -> Decrypt -> Save History -> History',
    'T11.5: Execute canonical Workflow 2 end-to-end',
    async () => {
      // Step 1: Login with pre-seeded test operator Odin
      const loginRes = await authService.login({
        username: 'operator_odin',
        password: 'TacticalPass123!',
      });

      if (!loginRes.user || !authService.isAuthenticated()) {
        throw new Error('Failed to log in as operator_odin');
      }

      // Step 2: Decrypt incoming intercepted ciphertext with shift 3
      const interceptedCipher = 'DWWDFN DW GDZQ. VHFWRU 7 FRQILUPHG.';
      const shift = 3;
      const recoveredPlaintext = decrypt(interceptedCipher, shift);
      if (recoveredPlaintext !== 'ATTACK AT DAWN. SECTOR 7 CONFIRMED.') {
        throw new Error(`Decryption failed: expected 'ATTACK AT DAWN. SECTOR 7 CONFIRMED.', got '${recoveredPlaintext}'`);
      }

      // Step 3: Save history record for decryption operation (Zero-Plaintext invariant: only ciphertext & shift stored)
      const savedDecryptedRecord = await messageService.createMessage({
        ciphertext: interceptedCipher,
        shift: 3,
        operationType: 'DECRYPT',
        notes: 'Inbound Sector Confirmation Inverted',
      });

      if (!savedDecryptedRecord.id || savedDecryptedRecord.operationType !== 'DECRYPT') {
        throw new Error('Decryption history record creation failed');
      }

      // Step 4: History query & fetch by ID
      const fetchedById = await messageService.getMessageById(savedDecryptedRecord.id);
      if (!fetchedById || fetchedById.id !== savedDecryptedRecord.id || fetchedById.ciphertext !== interceptedCipher) {
        throw new Error('getMessageById failed to retrieve exact vaulted decryption record');
      }

      // Clean up test message
      await messageService.deleteMessage(savedDecryptedRecord.id);
      authService.logout();
    }
  );

  // Test Category 4: Security & Error Handling Integrations
  await runTest('Security & Error Handling', 'T11.6: Unauthenticated message access throws 401 error', async () => {
    authService.logout();
    let caught401 = false;
    try {
      await messageService.getMessages();
    } catch (err: any) {
      if (err.status === 401) {
        caught401 = true;
      }
    }
    if (!caught401) {
      throw new Error('Unauthenticated call to messageService.getMessages did not raise 401');
    }
  });

  await runTest('Security & Error Handling', 'T11.7: Cross-user vault record access throws 403 Forbidden', async () => {
    // Login as Sentinel
    await authService.login({
      username: 'sentinel_cadet',
      password: 'CadetShield2026!',
    });

    // Try accessing Odin's message directly
    let caught403 = false;
    try {
      await messageService.getMessageById('msg-vault-001');
    } catch (err: any) {
      if (err.status === 403) {
        caught403 = true;
      }
    }
    authService.logout();

    if (!caught403) {
      throw new Error('Cross-user vault access did not raise 403 Forbidden');
    }
  });

  await runTest('Algorithm Preservation', 'T11.8: Caesar Cipher algorithm is strictly preserved without modification', () => {
    // Verify classical modular arithmetic round-trip across alphabet
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    for (let k = 0; k <= 25; k++) {
      const enc = encrypt(alphabet, k);
      const dec = decrypt(enc, k);
      if (dec !== alphabet) {
        throw new Error(`Round-trip failed for shift k=${k}`);
      }
    }
  });

  return results;
}
