/**
 * @file message.ts
 * @description Types and interfaces for Phase 7: Authenticated Message History Vault.
 */

export type VaultOperationType = 'ENCRYPT' | 'DECRYPT';

export interface VaultMessage {
  id: string;
  userId: string;
  operationType: VaultOperationType;
  ciphertext: string;
  shift: number;
  charCount: number;
  timestamp: string; // ISO 8601 UTC
  notes?: string;
}

export interface CreateVaultMessagePayload {
  ciphertext: string;
  shift: number;
  operationType?: VaultOperationType;
  notes?: string;
}

export type HistorySortOption =
  | 'newest'
  | 'oldest'
  | 'shift_asc'
  | 'shift_desc'
  | 'length_desc'
  | 'length_asc';

export interface HistoryFilterState {
  searchQuery: string;
  operationFilter: 'ALL' | VaultOperationType;
  sortBy: HistorySortOption;
}

export interface MessageVaultStats {
  totalMessages: number;
  totalEncrypted: number;
  totalDecrypted: number;
  lastMessageTimestamp: string | null;
}
