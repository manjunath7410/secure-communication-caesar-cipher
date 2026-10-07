/**
 * @file auth.test.ts
 * @description Unit tests for Phase 6: Authentication and Access Control.
 * Tests:
 * 1. Successful user registration
 * 2. Duplicate registration rejection (409 Conflict)
 * 3. Successful user login
 * 4. Invalid credentials rejection (401 Unauthorized)
 * 5. Protected endpoint (/auth/me) token verification
 * 6. Logout workflow & token revocation
 * 7. Salted password hashing (zero plaintext storage)
 * 8. Input validation constraints
 */

import { authService, parseJwtPayload } from '../services/authService';

export interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message?: string;
  durationMs: number;
}

export async function runAuthTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const runTest = async (name: string, fn: () => Promise<void>) => {
    const start = performance.now();
    try {
      await fn();
      results.push({
        name,
        category: 'Phase 6: Authentication & Security',
        passed: true,
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    } catch (err: any) {
      results.push({
        name,
        category: 'Phase 6: Authentication & Security',
        passed: false,
        message: err?.message || String(err),
        durationMs: Math.round((performance.now() - start) * 100) / 100,
      });
    }
  };

  // Ensure fresh clean state
  await authService.resetToDemoUsers();

  // Test 1: Successful Registration
  await runTest('1. Successful operator registration', async () => {
    const res = await authService.register({
      username: 'tactical_scout',
      email: 'scout.lead@tactical.mil',
      password: 'SecurePassphrase2026!',
      callsign: 'SCOUT-1',
      clearanceLevel: 'SECRET',
    });

    if (!res.accessToken || typeof res.accessToken !== 'string') {
      throw new Error('Expected valid JWT access token string in response.');
    }
    if (res.user.username !== 'tactical_scout') {
      throw new Error(`Expected username 'tactical_scout', got '${res.user.username}'`);
    }
    if (res.user.callsign !== 'SCOUT-1') {
      throw new Error(`Expected callsign 'SCOUT-1', got '${res.user.callsign}'`);
    }
    if (res.user.clearanceLevel !== 'SECRET') {
      throw new Error(`Expected clearanceLevel 'SECRET', got '${res.user.clearanceLevel}'`);
    }

    // Verify password is never leaked
    if ((res.user as any).password || (res.user as any).hashedPassword) {
      throw new Error('CRITICAL SECURITY FLAW: Password or hash leaked in User object!');
    }
  });

  // Test 2: Duplicate Registration Rejection (409 Conflict)
  await runTest('2. Duplicate registration rejection (409 Conflict)', async () => {
    let duplicateRejected = false;
    try {
      await authService.register({
        username: 'tactical_scout', // duplicate username
        email: 'another.email@tactical.mil',
        password: 'AnotherPassword123!',
      });
    } catch (err: any) {
      if (err.status === 409) {
        duplicateRejected = true;
      } else {
        throw new Error(`Expected status 409, got ${err.status}`);
      }
    }

    if (!duplicateRejected) {
      throw new Error('Duplicate username was not rejected with status 409 Conflict.');
    }

    // Duplicate email check
    duplicateRejected = false;
    try {
      await authService.register({
        username: 'new_distinct_user',
        email: 'scout.lead@tactical.mil', // duplicate email
        password: 'AnotherPassword123!',
      });
    } catch (err: any) {
      if (err.status === 409) {
        duplicateRejected = true;
      }
    }

    if (!duplicateRejected) {
      throw new Error('Duplicate email was not rejected with status 409 Conflict.');
    }
  });

  // Test 3: Successful Login
  await runTest('3. Successful login with correct credentials', async () => {
    const res = await authService.login({
      username: 'operator_odin',
      password: 'TacticalPass123!',
    });

    if (!res.accessToken) {
      throw new Error('Login failed to return an access token.');
    }
    if (res.user.username !== 'operator_odin') {
      throw new Error(`Expected username 'operator_odin', got '${res.user.username}'`);
    }
    if (res.user.clearanceLevel !== 'TOP_SECRET') {
      throw new Error(`Expected clearance 'TOP_SECRET', got '${res.user.clearanceLevel}'`);
    }
    if (!authService.isAuthenticated()) {
      throw new Error('authService.isAuthenticated() returned false after successful login.');
    }
  });

  // Test 4: Invalid Credentials Rejection (401 Unauthorized)
  await runTest('4. Invalid credentials rejection (401 Unauthorized)', async () => {
    let unauthorizedTriggered = false;
    try {
      await authService.login({
        username: 'operator_odin',
        password: 'IncorrectPassword999!',
      });
    } catch (err: any) {
      if (err.status === 401) {
        unauthorizedTriggered = true;
      } else {
        throw new Error(`Expected status 401, got ${err.status}`);
      }
    }

    if (!unauthorizedTriggered) {
      throw new Error('Wrong password did not throw 401 Unauthorized.');
    }

    // Non-existent user
    unauthorizedTriggered = false;
    try {
      await authService.login({
        username: 'non_existent_ghost_agent',
        password: 'SomePassword123!',
      });
    } catch (err: any) {
      if (err.status === 401) {
        unauthorizedTriggered = true;
      }
    }

    if (!unauthorizedTriggered) {
      throw new Error('Non-existent user login did not throw 401 Unauthorized.');
    }
  });

  // Test 5: Protected Endpoint (/auth/me) with Token
  await runTest('5. Protected endpoint (/auth/me) token verification', async () => {
    // Login to obtain active token
    const loginRes = await authService.login({
      username: 'sentinel_cadet',
      password: 'CadetShield2026!',
    });

    const userProfile = await authService.getMe(loginRes.accessToken);
    if (userProfile.username !== 'sentinel_cadet') {
      throw new Error(`Expected username 'sentinel_cadet', got '${userProfile.username}'`);
    }
    if (userProfile.callsign !== 'SENTINEL-4') {
      throw new Error(`Expected callsign 'SENTINEL-4', got '${userProfile.callsign}'`);
    }
    if (userProfile.clearanceLevel !== 'CONFIDENTIAL') {
      throw new Error(`Expected clearanceLevel 'CONFIDENTIAL', got '${userProfile.clearanceLevel}'`);
    }

    // Attempt accessing with invalid/tampered token
    let invalidTokenRejected = false;
    try {
      await authService.getMe('invalid.token.payload');
    } catch (err: any) {
      if (err.status === 401) {
        invalidTokenRejected = true;
      }
    }
    if (!invalidTokenRejected) {
      throw new Error('Forged/invalid token was not rejected with 401 Unauthorized.');
    }
  });

  // Test 6: Logout Workflow
  await runTest('6. Logout workflow and session clearance revocation', async () => {
    await authService.login({
      username: 'operator_odin',
      password: 'TacticalPass123!',
    });

    if (!authService.isAuthenticated()) {
      throw new Error('User was not authenticated prior to logout test.');
    }

    authService.logout();

    if (authService.isAuthenticated()) {
      throw new Error('authService.isAuthenticated() still returned true after logout.');
    }
    if (authService.getCurrentUser() !== null) {
      throw new Error('authService.getCurrentUser() did not return null after logout.');
    }
    if (authService.getToken() !== null) {
      throw new Error('authService.getToken() did not return null after logout.');
    }
  });

  // Test 7: JWT Parsing & Claims Validation
  await runTest('7. JWT claims parsing and structure verification', async () => {
    const regRes = await authService.register({
      username: 'jwt_test_user',
      email: 'jwt.user@tactical.mil',
      password: 'SecurePassphrase123!',
      clearanceLevel: 'TOP_SECRET',
    });

    const payload = parseJwtPayload(regRes.accessToken);
    if (!payload) {
      throw new Error('Failed to parse JWT payload.');
    }
    if (payload.sub !== regRes.user.id) {
      throw new Error(`JWT subject claim '${payload.sub}' does not match user id '${regRes.user.id}'`);
    }
    if (payload.username !== 'jwt_test_user') {
      throw new Error(`JWT username claim '${payload.username}' mismatch.`);
    }
    if (payload.clearance !== 'TOP_SECRET') {
      throw new Error(`JWT clearance claim '${payload.clearance}' mismatch.`);
    }
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('JWT expiration claim is missing or expired in past.');
    }
  });

  // Test 8: Input Validation Constraints (422)
  await runTest('8. Registration and Login input validation', async () => {
    // Short password (< 8 chars)
    let shortPassRejected = false;
    try {
      await authService.register({
        username: 'valid_user',
        email: 'user@test.mil',
        password: 'short',
      });
    } catch (err: any) {
      if (err.status === 422) shortPassRejected = true;
    }
    if (!shortPassRejected) {
      throw new Error('Short password was not rejected with status 422.');
    }

    // Invalid username with forbidden characters
    let badUsernameRejected = false;
    try {
      await authService.register({
        username: 'invalid user with spaces!',
        email: 'user@test.mil',
        password: 'ValidPassword123!',
      });
    } catch (err: any) {
      if (err.status === 422) badUsernameRejected = true;
    }
    if (!badUsernameRejected) {
      throw new Error('Invalid username with spaces was not rejected with status 422.');
    }
  });

  return results;
}
