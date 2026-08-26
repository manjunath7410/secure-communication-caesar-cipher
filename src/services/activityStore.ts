/**
 * @file activityStore.ts
 * @description Local state and storage manager for tracking Caesar Cipher operations, statistics, and recent activity logs.
 */

export type OperationType = 'ENCRYPT' | 'DECRYPT';

export interface OperationActivity {
  id: string;
  type: OperationType;
  shift: number;
  inputSnippet: string;
  inputLength: number;
  outputSnippet: string;
  outputLength: number;
  timestamp: number;
  success: boolean;
  notes?: string;
}

export interface OperationStats {
  totalEncryptions: number;
  totalDecryptions: number;
  totalOperations: number;
  lastOperationTimestamp: number | null;
}

const STORAGE_KEY_ACTIVITIES = 'caesar_cipher_activities_v1';
const STORAGE_KEY_STATS = 'caesar_cipher_stats_v1';
const STORAGE_KEY_SELECTED_SHIFT = 'caesar_cipher_selected_shift_v1';

// Pre-seeded initial records for realistic initial display
const INITIAL_ACTIVITIES: OperationActivity[] = [
  {
    id: 'op-init-101',
    type: 'ENCRYPT',
    shift: 3,
    inputSnippet: 'SQUADRON DELTA: PROCEED TO GRID 48.85N, 2.29E AT 0600Z.',
    inputLength: 55,
    outputSnippet: 'VRXDGURQ GHOWD: SURFHHG WR JULG 48.85Q, 2.29H DW 0600C.',
    outputLength: 55,
    timestamp: Date.now() - 1000 * 60 * 18,
    success: true,
    notes: 'Classical Caesar Shift (k=3)',
  },
  {
    id: 'op-init-102',
    type: 'DECRYPT',
    shift: 3,
    inputSnippet: 'DWWDFN DW GDZQ. VHFWRU 7 FRQILUPHG.',
    inputLength: 35,
    outputSnippet: 'ATTACK AT DAWN. SECTOR 7 CONFIRMED.',
    outputLength: 35,
    timestamp: Date.now() - 1000 * 60 * 12,
    success: true,
    notes: 'Inverse Decryption (k=3)',
  },
  {
    id: 'op-init-103',
    type: 'ENCRYPT',
    shift: 13,
    inputSnippet: 'CONFIDENTIAL TACTICAL PROTOCOL ALPHA-9',
    inputLength: 38,
    outputSnippet: 'PBASVQ ragvny gnp gvpny cebgbpby nycun-9',
    outputLength: 38,
    timestamp: Date.now() - 1000 * 60 * 5,
    success: true,
    notes: 'ROT13 Symmetric Shift (k=13)',
  },
];

const INITIAL_STATS: OperationStats = {
  totalEncryptions: 14,
  totalDecryptions: 8,
  totalOperations: 22,
  lastOperationTimestamp: Date.now() - 1000 * 60 * 5,
};

// In-memory runtime state store (ensures continuous state in Node CLI test runner, SSR, and browsers)
const memoryStore = {
  stats: { ...INITIAL_STATS },
  activities: [...INITIAL_ACTIVITIES],
  selectedShift: 3,
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener error
    }
  });
}

function safeLocalStorageGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

function safeLocalStorageSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Graceful fallback for restricted iframe storage
  }
}

/**
 * Retrieves the current operations statistics
 */
export function getOperationStats(): OperationStats {
  if (typeof window !== 'undefined' && window.localStorage) {
    return safeLocalStorageGet<OperationStats>(STORAGE_KEY_STATS, memoryStore.stats);
  }
  return memoryStore.stats;
}

/**
 * Retrieves the list of recent operation activities (newest first)
 */
export function getRecentActivities(): OperationActivity[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    return safeLocalStorageGet<OperationActivity[]>(STORAGE_KEY_ACTIVITIES, memoryStore.activities);
  }
  return memoryStore.activities;
}

/**
 * Retrieves the currently selected global shift
 */
export function getSelectedShift(): number {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = safeLocalStorageGet<number>(STORAGE_KEY_SELECTED_SHIFT, memoryStore.selectedShift);
    return typeof saved === 'number' && saved >= 0 && saved <= 25 ? saved : 3;
  }
  return memoryStore.selectedShift;
}

/**
 * Persists the currently selected global shift
 */
export function setSelectedShift(shift: number): void {
  const normalized = ((shift % 26) + 26) % 26;
  memoryStore.selectedShift = normalized;
  safeLocalStorageSet(STORAGE_KEY_SELECTED_SHIFT, normalized);
  notifyListeners();
}

/**
 * Records a new encryption or decryption operation
 */
export function logOperation(
  type: OperationType,
  shift: number,
  input: string,
  output: string,
  notes?: string
): OperationActivity {
  const stats = getOperationStats();
  const activities = getRecentActivities();

  const isEncrypt = type === 'ENCRYPT';
  const newStats: OperationStats = {
    totalEncryptions: isEncrypt ? stats.totalEncryptions + 1 : stats.totalEncryptions,
    totalDecryptions: !isEncrypt ? stats.totalDecryptions + 1 : stats.totalDecryptions,
    totalOperations: stats.totalOperations + 1,
    lastOperationTimestamp: Date.now(),
  };

  const inputSnippet = input.length > 80 ? input.slice(0, 77) + '...' : input;
  const outputSnippet = output.length > 80 ? output.slice(0, 77) + '...' : output;

  const newActivity: OperationActivity = {
    id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    shift: ((shift % 26) + 26) % 26,
    inputSnippet,
    inputLength: input.length,
    outputSnippet,
    outputLength: output.length,
    timestamp: Date.now(),
    success: true,
    notes: notes || (type === 'ENCRYPT' ? `Encrypted with k=${shift}` : `Decrypted with k=${shift}`),
  };

  const updatedActivities = [newActivity, ...activities].slice(0, 50); // Keep last 50

  memoryStore.stats = newStats;
  memoryStore.activities = updatedActivities;

  safeLocalStorageSet(STORAGE_KEY_STATS, newStats);
  safeLocalStorageSet(STORAGE_KEY_ACTIVITIES, updatedActivities);

  notifyListeners();
  return newActivity;
}

/**
 * Clears all recent activities and resets statistics
 */
export function clearActivityLog(): void {
  const resetStats: OperationStats = {
    totalEncryptions: 0,
    totalDecryptions: 0,
    totalOperations: 0,
    lastOperationTimestamp: null,
  };

  memoryStore.stats = resetStats;
  memoryStore.activities = [];

  safeLocalStorageSet(STORAGE_KEY_STATS, resetStats);
  safeLocalStorageSet(STORAGE_KEY_ACTIVITIES, []);
  notifyListeners();
}

/**
 * Resets storage back to initial sample demo state
 */
export function resetToDemoActivity(): void {
  memoryStore.stats = { ...INITIAL_STATS };
  memoryStore.activities = [...INITIAL_ACTIVITIES];
  memoryStore.selectedShift = 3;

  safeLocalStorageSet(STORAGE_KEY_STATS, INITIAL_STATS);
  safeLocalStorageSet(STORAGE_KEY_ACTIVITIES, INITIAL_ACTIVITIES);
  safeLocalStorageSet(STORAGE_KEY_SELECTED_SHIFT, 3);
  notifyListeners();
}

/**
 * Subscribes a React component or listener to changes in operation storage
 */
export function subscribeToOperations(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
