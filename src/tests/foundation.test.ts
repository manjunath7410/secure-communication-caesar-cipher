/**
 * Phase 1 Foundation Verification Test Suite
 * Self-contained diagnostic test runner.
 */
import { APP_METADATA, SYSTEM_PHASES } from '../utils/constants';
import { formatTimestamp, truncateString } from '../utils/formatting';
import { HealthService } from '../services/healthService';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export async function runFoundationTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Academic Metadata
  try {
    if (
      APP_METADATA.name === 'Secure Military Communication Using Caesar Cipher' &&
      APP_METADATA.academicNotice.includes('ACADEMIC CRYPTOGRAPHY DEMONSTRATION')
    ) {
      results.push({ name: 'Metadata & Academic Notice Validation', passed: true });
    } else {
      results.push({ name: 'Metadata & Academic Notice Validation', passed: false, error: 'Metadata mismatch' });
    }
  } catch (err) {
    results.push({ name: 'Metadata & Academic Notice Validation', passed: false, error: String(err) });
  }

  // Test 2: System Phases (20 Phases)
  try {
    if (SYSTEM_PHASES.length === 20 && SYSTEM_PHASES[0].code === 'PHASE 0') {
      results.push({ name: '20-Phase System Architecture Roadmap Integrity', passed: true });
    } else {
      results.push({ name: '20-Phase System Architecture Roadmap Integrity', passed: false, error: `Expected 20 phases, got ${SYSTEM_PHASES.length}` });
    }
  } catch (err) {
    results.push({ name: '20-Phase System Architecture Roadmap Integrity', passed: false, error: String(err) });
  }

  // Test 3: Formatting Utilities
  try {
    const formatted = formatTimestamp(new Date('2026-08-24T12:00:00Z'));
    const truncated = truncateString('SecureMilitaryCommunication', 10);
    if (formatted.includes('2026-08-24') && truncated === 'SecureM...') {
      results.push({ name: 'Formatting & Date Time String Utilities', passed: true });
    } else {
      results.push({ name: 'Formatting & Date Time String Utilities', passed: false, error: 'Formatting unexpected output' });
    }
  } catch (err) {
    results.push({ name: 'Formatting & Date Time String Utilities', passed: false, error: String(err) });
  }

  // Test 4: Health Service Subsystem Scan
  try {
    const service = new HealthService();
    const report = await service.getHealthReport();
    if (report.status === 'operational' && report.subsystems.length >= 5 && report.isEducational) {
      results.push({ name: 'Health Service Diagnostics & Subsystem Sub-matrix', passed: true });
    } else {
      results.push({ name: 'Health Service Diagnostics & Subsystem Sub-matrix', passed: false, error: 'Health report incomplete' });
    }
  } catch (err) {
    results.push({ name: 'Health Service Diagnostics & Subsystem Sub-matrix', passed: false, error: String(err) });
  }

  return results;
}
