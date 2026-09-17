/**
 * @file messageService.ts
 * @description Client-side and API service for Phase 7 & Phase 11: Authenticated Message History Vault.
 * Integrates directly with FastAPI backend (`/messages`, `/messages/{id}`) via central defaultApiClient.
 * Strictly guarantees user message isolation and zero-plaintext storage with robust offline resilience.
 */

import {
  VaultMessage,
  CreateVaultMessagePayload,
  HistoryFilterState,
  MessageVaultStats,
  VaultOperationType,
} from '../types/message';
import { authService } from './authService';
import { defaultApiClient, ApiError } from './apiClient';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';

const STORAGE_KEY_VAULT_DB = 'caesar_cipher_vault_messages_v1';

// Seed demo messages for test operators
const INITIAL_DEMO_MESSAGES: VaultMessage[] = [
  {
    id: 'msg-vault-001',
    userId: 'usr-odin-001',
    operationType: 'ENCRYPT',
    ciphertext: 'VRXDGURQ GHOWD: SURFHHG WR JULG 48.85Q, 2.29H DW 0600C.',
    shift: 3,
    charCount: 55,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    notes: 'Tactical Recon Dispatch (k=3)',
  },
  {
    id: 'msg-vault-002',
    userId: 'usr-odin-001',
    operationType: 'ENCRYPT',
    ciphertext: 'PBASVQ ragvny gnp gvpny cebgbpby nycun-9',
    shift: 13,
    charCount: 39,
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    notes: 'ROT13 Symmetric Key Alpha',
  },
  {
    id: 'msg-vault-003',
    userId: 'usr-sentinel-002',
    operationType: 'DECRYPT',
    ciphertext: 'DWWDFN DW GDZQ. VHFWRU 7 FRQILUPHG.',
    shift: 3,
    charCount: 35,
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    notes: 'Inbound Sector Confirmation',
  },
];

function normalizeVaultMessage(raw: any): VaultMessage {
  return {
    id: raw.id,
    userId: raw.user_id || raw.userId,
    operationType: (raw.operation_type || raw.operationType || 'ENCRYPT') as VaultOperationType,
    ciphertext: raw.ciphertext,
    shift: typeof raw.shift === 'number' ? raw.shift : parseInt(raw.shift, 10) || 0,
    charCount: raw.char_count !== undefined ? raw.char_count : (raw.charCount !== undefined ? raw.charCount : raw.ciphertext?.length || 0),
    timestamp: raw.timestamp || new Date().toISOString(),
    notes: raw.notes || undefined,
  };
}

class MessageService {
  private inMemoryMessages: VaultMessage[] = [...INITIAL_DEMO_MESSAGES];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initFromStorage();
  }

  private initFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VAULT_DB);
      if (saved) {
        this.inMemoryMessages = JSON.parse(saved);
      } else {
        localStorage.setItem(STORAGE_KEY_VAULT_DB, JSON.stringify(INITIAL_DEMO_MESSAGES));
      }
    } catch {
      // Storage unavailable in sandbox
    }
  }

  private saveMessages() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_VAULT_DB, JSON.stringify(this.inMemoryMessages));
      } catch {}
    }
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch {}
    });
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /**
   * Helper to resolve active authenticated user ID or throw 401
   */
  private requireAuthenticatedUserId(): string {
    const user = authService.getCurrentUser();
    if (!user || !user.id || !authService.isAuthenticated()) {
      throw {
        status: 401,
        message: 'Authentication required. Missing operational clearance token.',
      };
    }
    return user.id;
  }

  /**
   * GET /messages - Retrieves messages strictly for the currently authenticated user
   */
  public async getMessages(filters?: Partial<HistoryFilterState>): Promise<VaultMessage[]> {
    const currentUserId = this.requireAuthenticatedUserId();

    // 1. If Firebase user is authenticated, query from Firestore
    if (auth.currentUser && auth.currentUser.uid === currentUserId) {
      const messagesCollectionPath = `users/${currentUserId}/messages`;
      try {
        const querySnapshot = await getDocs(collection(db, 'users', currentUserId, 'messages'));
        const firestoreList: VaultMessage[] = [];
        querySnapshot.forEach((docSnap) => {
          const d = docSnap.data();
          firestoreList.push({
            id: docSnap.id,
            userId: d.userId || currentUserId,
            operationType: (d.operationType || 'ENCRYPT') as VaultOperationType,
            ciphertext: d.ciphertext || '',
            shift: typeof d.shift === 'number' ? d.shift : 0,
            charCount: typeof d.characterCount === 'number' ? d.characterCount : (d.ciphertext?.length || 0),
            timestamp: d.createdAt || new Date().toISOString(),
            notes: d.notes || undefined,
          });
        });

        // Filter and sort
        let results = firestoreList;
        if (filters?.operationFilter && filters.operationFilter !== 'ALL') {
          results = results.filter((m) => m.operationType === filters.operationFilter);
        }
        if (filters?.searchQuery && filters.searchQuery.trim()) {
          const query = filters.searchQuery.trim().toLowerCase();
          results = results.filter(
            (m) =>
              m.ciphertext.toLowerCase().includes(query) ||
              (m.notes && m.notes.toLowerCase().includes(query)) ||
              `shift ${m.shift}`.toLowerCase().includes(query) ||
              `k=${m.shift}`.toLowerCase().includes(query)
          );
        }

        const sortBy = filters?.sortBy || 'newest';
        results.sort((a, b) => {
          switch (sortBy) {
            case 'newest':
              return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            case 'oldest':
              return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            case 'shift_asc':
              return a.shift - b.shift;
            case 'shift_desc':
              return b.shift - a.shift;
            case 'length_desc':
              return b.charCount - a.charCount;
            case 'length_asc':
              return a.charCount - b.charCount;
            default:
              return 0;
          }
        });

        const otherUsersMessages = this.inMemoryMessages.filter((m) => m.userId !== currentUserId);
        this.inMemoryMessages = [...results, ...otherUsersMessages];
        this.saveMessages();
        return results;
      } catch (err: any) {
        if (err?.code?.includes('permission') || err?.message?.includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.LIST, messagesCollectionPath);
        }
        console.warn('Firestore messages fetch notice:', err);
      }
    }

    try {
      // 2. Attempt Backend Endpoint if not Firebase or as fallback
      const queryParams: Record<string, string | number | undefined> = {
        limit: 100,
        skip: 0,
      };
      if (filters?.searchQuery && filters.searchQuery.trim()) {
        queryParams.search = filters.searchQuery.trim();
      }
      if (filters?.operationFilter && filters.operationFilter !== 'ALL') {
        queryParams.operation_type = filters.operationFilter;
      }

      const response = await defaultApiClient.get<{ total: number; items: any[] }>(
        '/messages',
        queryParams
      );

      if (response && Array.isArray(response.items)) {
        let items = response.items.map(normalizeVaultMessage);

        // Apply Sorting
        const sortBy = filters?.sortBy || 'newest';
        items.sort((a, b) => {
          switch (sortBy) {
            case 'newest':
              return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            case 'oldest':
              return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            case 'shift_asc':
              return a.shift - b.shift;
            case 'shift_desc':
              return b.shift - a.shift;
            case 'length_desc':
              return b.charCount - a.charCount;
            case 'length_asc':
              return a.charCount - b.charCount;
            default:
              return 0;
          }
        });

        // Sync local cache for offline resiliency
        const otherUsersMessages = this.inMemoryMessages.filter((m) => m.userId !== currentUserId);
        this.inMemoryMessages = [...items, ...otherUsersMessages];
        this.saveMessages();

        return items;
      }
    } catch (err: any) {
      if (err instanceof ApiError && !err.isNetworkError) {
        throw {
          status: err.status,
          message: err.message,
        };
      }
    }

    // 3. Offline / Local Fallback with Strict User Isolation
    let results = this.inMemoryMessages.filter((m) => m.userId === currentUserId);

    if (filters?.operationFilter && filters.operationFilter !== 'ALL') {
      results = results.filter((m) => m.operationType === filters.operationFilter);
    }

    if (filters?.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.trim().toLowerCase();
      results = results.filter(
        (m) =>
          m.ciphertext.toLowerCase().includes(query) ||
          (m.notes && m.notes.toLowerCase().includes(query)) ||
          `shift ${m.shift}`.toLowerCase().includes(query) ||
          `k=${m.shift}`.toLowerCase().includes(query)
      );
    }

    // Apply Sorting
    const sortBy = filters?.sortBy || 'newest';
    results.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'shift_asc':
          return a.shift - b.shift;
        case 'shift_desc':
          return b.shift - a.shift;
        case 'length_desc':
          return b.charCount - a.charCount;
        case 'length_asc':
          return a.charCount - b.charCount;
        default:
          return 0;
      }
    });

    return results;
  }

  /**
   * GET /messages/{id} - Retrieves a single message by ID, verifying user ownership
   */
  public async getMessageById(messageId: string): Promise<VaultMessage> {
    const currentUserId = this.requireAuthenticatedUserId();

    try {
      const response = await defaultApiClient.get<any>(`/messages/${encodeURIComponent(messageId)}`);
      if (response && response.id) {
        return normalizeVaultMessage(response);
      }
    } catch (err: any) {
      if (err instanceof ApiError && !err.isNetworkError) {
        throw {
          status: err.status,
          message: err.message,
        };
      }
    }

    // Offline / Local Fallback
    const msg = this.inMemoryMessages.find((m) => m.id === messageId);
    if (!msg) {
      throw {
        status: 404,
        message: `Vault message record '${messageId}' not found.`,
      };
    }

    // Strict Authorization Check: Must be owned by current user
    if (msg.userId !== currentUserId) {
      throw {
        status: 403,
        message: 'Access Denied: You do not possess clearance for this vault record.',
      };
    }

    return msg;
  }

  /**
   * POST /messages - Creates a new message record in the user's vault
   */
  public async createMessage(payload: CreateVaultMessagePayload): Promise<VaultMessage> {
    const currentUserId = this.requireAuthenticatedUserId();

    if (!payload.ciphertext || payload.ciphertext.trim().length === 0) {
      throw {
        status: 400,
        message: 'Ciphertext payload cannot be empty.',
      };
    }

    const normalizedShift = ((payload.shift % 26) + 26) % 26;
    const newDocId = `msg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newMsg: VaultMessage = {
      id: newDocId,
      userId: currentUserId,
      operationType: payload.operationType || 'ENCRYPT',
      ciphertext: payload.ciphertext,
      shift: normalizedShift,
      charCount: payload.ciphertext.length,
      timestamp: nowIso,
      notes: payload.notes?.trim() || undefined,
    };

    // If Firebase user is authenticated, persist to Firestore
    if (auth.currentUser && auth.currentUser.uid === currentUserId) {
      const docPath = `users/${currentUserId}/messages/${newDocId}`;
      try {
        await setDoc(doc(db, 'users', currentUserId, 'messages', newDocId), {
          id: newDocId,
          userId: currentUserId,
          ciphertext: payload.ciphertext,
          shift: normalizedShift,
          operationType: payload.operationType || 'ENCRYPT',
          notes: payload.notes?.trim() || '',
          characterCount: payload.ciphertext.length,
          createdAt: nowIso,
        });
      } catch (err: any) {
        if (err?.code?.includes('permission') || err?.message?.includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.CREATE, docPath);
        }
        console.warn('Firestore write message notice:', err);
      }
    }

    try {
      const response = await defaultApiClient.post<any>('/messages', {
        ciphertext: payload.ciphertext,
        shift: normalizedShift,
        operation_type: payload.operationType || 'ENCRYPT',
        notes: payload.notes?.trim() || undefined,
      });

      if (response && response.id) {
        const createdMsg = normalizeVaultMessage(response);
        this.inMemoryMessages.unshift(createdMsg);
        this.saveMessages();
        this.notify();
        return createdMsg;
      }
    } catch (err: any) {
      if (err instanceof ApiError && !err.isNetworkError) {
        throw {
          status: err.status,
          message: err.message,
        };
      }
    }

    // Local in-memory / cache update
    this.inMemoryMessages.unshift(newMsg);
    this.saveMessages();
    this.notify();

    return newMsg;
  }

  /**
   * DELETE /messages/{id} - Deletes a message by ID, verifying user ownership
   */
  public async deleteMessage(messageId: string): Promise<boolean> {
    const currentUserId = this.requireAuthenticatedUserId();

    // If Firebase user is authenticated, delete from Firestore
    if (auth.currentUser && auth.currentUser.uid === currentUserId) {
      const docPath = `users/${currentUserId}/messages/${messageId}`;
      try {
        await deleteDoc(doc(db, 'users', currentUserId, 'messages', messageId));
      } catch (err: any) {
        if (err?.code?.includes('permission') || err?.message?.includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.DELETE, docPath);
        }
        console.warn('Firestore delete message notice:', err);
      }
    }

    try {
      const response = await defaultApiClient.delete<any>(`/messages/${encodeURIComponent(messageId)}`);
      if (response && response.success) {
        this.inMemoryMessages = this.inMemoryMessages.filter((m) => m.id !== messageId);
        this.saveMessages();
        this.notify();
        return true;
      }
    } catch (err: any) {
      if (err instanceof ApiError && !err.isNetworkError) {
        throw {
          status: err.status,
          message: err.message,
        };
      }
    }

    // Offline Fallback
    const msgIndex = this.inMemoryMessages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) {
      this.inMemoryMessages = this.inMemoryMessages.filter((m) => m.id !== messageId);
      this.saveMessages();
      this.notify();
      return true;
    }

    const msg = this.inMemoryMessages[msgIndex];
    if (msg.userId !== currentUserId) {
      throw {
        status: 403,
        message: 'Access Denied: You cannot delete a record belonging to another operator.',
      };
    }

    this.inMemoryMessages.splice(msgIndex, 1);
    this.saveMessages();
    this.notify();

    return true;
  }

  /**
   * Clears all messages for the current authenticated user (DELETE /messages)
   */
  public async clearUserVault(): Promise<number> {
    const currentUserId = this.requireAuthenticatedUserId();

    // If Firebase user is authenticated, clear from Firestore
    if (auth.currentUser && auth.currentUser.uid === currentUserId) {
      const path = `users/${currentUserId}/messages`;
      try {
        const querySnapshot = await getDocs(collection(db, 'users', currentUserId, 'messages'));
        for (const docSnap of querySnapshot.docs) {
          await deleteDoc(docSnap.ref).catch(() => {});
        }
      } catch (err: any) {
        if (err?.code?.includes('permission') || err?.message?.includes('Missing or insufficient permissions')) {
          handleFirestoreError(err, OperationType.DELETE, path);
        }
        console.warn('Firestore clear messages notice:', err);
      }
    }

    try {
      const response = await defaultApiClient.delete<any>('/messages');
      if (response && response.success) {
        const initialCount = this.inMemoryMessages.length;
        this.inMemoryMessages = this.inMemoryMessages.filter((m) => m.userId !== currentUserId);
        const deletedCount = initialCount - this.inMemoryMessages.length;
        this.saveMessages();
        this.notify();
        return deletedCount;
      }
    } catch (err: any) {
      if (err instanceof ApiError && !err.isNetworkError) {
        throw {
          status: err.status,
          message: err.message,
        };
      }
    }

    // Offline Fallback
    const initialCount = this.inMemoryMessages.length;
    this.inMemoryMessages = this.inMemoryMessages.filter((m) => m.userId !== currentUserId);
    const deletedCount = initialCount - this.inMemoryMessages.length;
    this.saveMessages();
    this.notify();
    return deletedCount;
  }

  /**
   * Computes statistics for the current authenticated user
   */
  public async getStats(): Promise<MessageVaultStats> {
    const user = authService.getCurrentUser();
    if (!user || !user.id || !authService.isAuthenticated()) {
      return {
        totalMessages: 0,
        totalEncrypted: 0,
        totalDecrypted: 0,
        lastMessageTimestamp: null,
      };
    }

    // Attempt to get fresh messages
    try {
      const msgs = await this.getMessages({ sortBy: 'newest' });
      const totalEncrypted = msgs.filter((m) => m.operationType === 'ENCRYPT').length;
      const totalDecrypted = msgs.filter((m) => m.operationType === 'DECRYPT').length;
      const lastTimestamp = msgs.length > 0 ? msgs[0].timestamp : null;

      return {
        totalMessages: msgs.length,
        totalEncrypted,
        totalDecrypted,
        lastMessageTimestamp: lastTimestamp,
      };
    } catch {
      const userMsgs = this.inMemoryMessages.filter((m) => m.userId === user.id);
      const totalEncrypted = userMsgs.filter((m) => m.operationType === 'ENCRYPT').length;
      const totalDecrypted = userMsgs.filter((m) => m.operationType === 'DECRYPT').length;
      const lastTimestamp = userMsgs.length > 0 ? userMsgs[0].timestamp : null;

      return {
        totalMessages: userMsgs.length,
        totalEncrypted,
        totalDecrypted,
        lastMessageTimestamp: lastTimestamp,
      };
    }
  }

  /**
   * Resets message store to initial seed state
   */
  public resetToDemoVault(): void {
    this.inMemoryMessages = [...INITIAL_DEMO_MESSAGES];
    this.saveMessages();
    this.notify();
  }
}

export const messageService = new MessageService();

