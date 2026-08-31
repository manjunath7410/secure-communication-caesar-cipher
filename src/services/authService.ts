/**
 * @file authService.ts
 * @description Production Client Authentication Service for Secure Communication.
 * Communicates with backend Express/FastAPI endpoints (/api/v1/auth) via central defaultApiClient.
 * Provides secure session token management, standard error normalization, WebAuthn detection, and offline resilience.
 */

import {
  User,
  ClearanceLevel,
  RegisterPayload,
  LoginPayload,
  AuthResponse,
  AuthError,
} from '../types/auth';
import { defaultApiClient, ApiError } from './apiClient';

const STORAGE_KEY_TOKEN = 'caesar_cipher_auth_token_v1';
const STORAGE_KEY_USER = 'caesar_cipher_auth_user_v1';
const STORAGE_KEY_REMEMBER = 'caesar_cipher_remember_device_v1';

// Normalizer to convert backend snake_case user models to frontend User interface
function normalizeUser(rawUser: any): User {
  if (!rawUser) {
    throw new Error('Invalid user payload');
  }
  return {
    id: rawUser.id || rawUser.sub || `usr-${Date.now()}`,
    email: rawUser.email || '',
    username: rawUser.username || rawUser.email?.split('@')[0] || 'user',
    fullName: rawUser.full_name || rawUser.fullName || rawUser.name || rawUser.username || '',
    callsign: rawUser.callsign || null,
    clearanceLevel: (rawUser.clearance_level || rawUser.clearanceLevel || 'SECRET') as ClearanceLevel,
    isActive: rawUser.is_active !== undefined ? rawUser.is_active : (rawUser.isActive !== undefined ? rawUser.isActive : true),
    isEmailVerified: rawUser.is_email_verified !== undefined ? rawUser.is_email_verified : (rawUser.isEmailVerified !== undefined ? rawUser.isEmailVerified : false),
    createdAt: rawUser.created_at || rawUser.createdAt || new Date().toISOString(),
    lastLoginAt: rawUser.last_login_at || rawUser.lastLoginAt,
  };
}

export function parseJwtPayload(token: string): { sub?: string; email?: string; username?: string; clearance?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

function normalizeAuthError(err: any): AuthError {
  if (err instanceof ApiError) {
    if (err.isNetworkError) {
      return {
        status: 0,
        message: "We couldn't connect to the server.",
        isNetworkError: true,
      };
    }
    if (err.status === 401) {
      return {
        status: 401,
        message: 'Email or password is incorrect.',
        field: err.field,
      };
    }
    if (err.status === 403) {
      return {
        status: 403,
        message: "You don't have permission to continue.",
        field: err.field,
      };
    }
    if (err.status === 404) {
      return {
        status: 404,
        message: 'Authentication service is unavailable.',
        field: err.field,
      };
    }
    if (err.status === 429) {
      return {
        status: 429,
        message: 'Too many attempts. Please wait before trying again.',
        field: err.field,
      };
    }
    if (err.status === 500) {
      return {
        status: 500,
        message: 'Something went wrong. Please try again.',
        field: err.field,
      };
    }
    return {
      status: err.status,
      message: err.message || 'Something went wrong. Please try again.',
      field: err.field,
    };
  }

  if (err && typeof err === 'object' && 'status' in err) {
    return err as AuthError;
  }

  return {
    status: 500,
    message: err?.message || 'Something went wrong. Please try again.',
  };
}

class AuthService {
  private inMemoryToken: string | null = null;
  private inMemoryUser: User | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initFromStorage();
    defaultApiClient.onUnauthorized(() => {
      this.logout();
    });
  }

  private initFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const isRemembered = localStorage.getItem(STORAGE_KEY_REMEMBER) === 'true';
      const storage = isRemembered ? localStorage : sessionStorage;

      const savedToken = storage.getItem(STORAGE_KEY_TOKEN) || localStorage.getItem(STORAGE_KEY_TOKEN);
      const savedUser = storage.getItem(STORAGE_KEY_USER) || localStorage.getItem(STORAGE_KEY_USER);

      if (savedToken && savedUser) {
        this.inMemoryToken = savedToken;
        this.inMemoryUser = JSON.parse(savedUser);
        defaultApiClient.setToken(savedToken);
      }
    } catch {
      // Storage restricted in sandbox
    }
  }

  private persistSession(token: string, user: User, rememberDevice: boolean = true) {
    this.inMemoryToken = token;
    this.inMemoryUser = user;
    defaultApiClient.setToken(token);

    if (typeof window !== 'undefined') {
      try {
        if (rememberDevice) {
          localStorage.setItem(STORAGE_KEY_REMEMBER, 'true');
          localStorage.setItem(STORAGE_KEY_TOKEN, token);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
          sessionStorage.removeItem(STORAGE_KEY_TOKEN);
          sessionStorage.removeItem(STORAGE_KEY_USER);
        } else {
          localStorage.removeItem(STORAGE_KEY_REMEMBER);
          localStorage.removeItem(STORAGE_KEY_TOKEN);
          localStorage.removeItem(STORAGE_KEY_USER);
          sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
          sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        }
      } catch {
        // Ignore storage exceptions
      }
    }

    this.notify();
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

  public getToken(): string | null {
    if (this.inMemoryToken) return this.inMemoryToken;
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(STORAGE_KEY_TOKEN) || sessionStorage.getItem(STORAGE_KEY_TOKEN);
      } catch {
        return null;
      }
    }
    return null;
  }

  public getCurrentUser(): User | null {
    if (this.inMemoryUser) return this.inMemoryUser;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_USER) || sessionStorage.getItem(STORAGE_KEY_USER);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch {}
    }
    return null;
  }

  public isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const payload = parseJwtPayload(token);
    if (!payload || !payload.exp) return true;
    return payload.exp * 1000 > Date.now();
  }

  /**
   * Primary Login Method (POST /api/v1/auth/login)
   */
  public async login(payload: LoginPayload): Promise<AuthResponse> {
    const identifier = (payload.email || payload.username || '').trim();
    const password = payload.password;
    const remember = payload.rememberDevice ?? true;

    if (!identifier || !password) {
      throw {
        status: 422,
        message: 'Email address and password are required.',
      } as AuthError;
    }

    try {
      const response = await defaultApiClient.post<any>(
        '/auth/login',
        {
          email: identifier,
          username: identifier,
          password,
        },
        { skipAuth: true }
      );

      const token = response.access_token || response.accessToken;
      const normalizedUser = normalizeUser(response.user);

      this.persistSession(token, normalizedUser, remember);

      return {
        accessToken: token,
        tokenType: response.token_type || response.tokenType || 'bearer',
        expiresIn: response.expires_in || response.expiresIn || 7200,
        user: normalizedUser,
      };
    } catch (err: any) {
      throw normalizeAuthError(err);
    }
  }

  /**
   * Primary Registration Method (POST /api/v1/auth/register)
   */
  public async register(payload: RegisterPayload): Promise<AuthResponse> {
    const email = (payload.email || '').trim().toLowerCase();
    const fullName = (payload.fullName || payload.username || '').trim();
    const username = (payload.username || email.split('@')[0] || 'user').trim();
    const password = payload.password;

    // Frontend validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw {
        status: 422,
        message: 'Enter a valid email address.',
        field: 'email',
      } as AuthError;
    }

    if (!password || password.length < 8) {
      throw {
        status: 422,
        message: 'Password must be at least 8 characters long.',
        field: 'password',
      } as AuthError;
    }

    try {
      const response = await defaultApiClient.post<any>(
        '/auth/register',
        {
          email,
          username,
          full_name: fullName,
          fullName,
          password,
          callsign: payload.callsign?.trim() || null,
          clearance_level: payload.clearanceLevel || 'SECRET',
        },
        { skipAuth: true }
      );

      const token = response.access_token || response.accessToken;
      const normalizedUser = normalizeUser(response.user);

      this.persistSession(token, normalizedUser, true);

      return {
        accessToken: token,
        tokenType: response.token_type || response.tokenType || 'bearer',
        expiresIn: response.expires_in || response.expiresIn || 7200,
        user: normalizedUser,
        requiresVerification: response.requires_verification ?? true,
      };
    } catch (err: any) {
      throw normalizeAuthError(err);
    }
  }

  /**
   * Google OAuth Sign-in Handler (POST /api/v1/auth/google)
   */
  public async loginWithGoogle(credential: string): Promise<AuthResponse> {
    try {
      const response = await defaultApiClient.post<any>(
        '/auth/google',
        { credential },
        { skipAuth: true }
      );

      const token = response.access_token || response.accessToken;
      const normalizedUser = normalizeUser(response.user);

      this.persistSession(token, normalizedUser, true);

      return {
        accessToken: token,
        tokenType: response.token_type || response.tokenType || 'bearer',
        expiresIn: response.expires_in || response.expiresIn || 7200,
        user: normalizedUser,
      };
    } catch (err: any) {
      throw normalizeAuthError(err);
    }
  }

  /**
   * Firebase Google Popup Sign-in & Firestore User Sync
   */
  public async signInWithFirebaseGoogle(): Promise<User> {
    try {
      const { signInWithPopup } = await import('firebase/auth');
      const { doc, setDoc, getDoc } = await import('firebase/firestore');
      const { auth, googleProvider, db } = await import('./firebase');

      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      const normalizedUser: User = {
        id: fbUser.uid,
        email: fbUser.email || '',
        username: (fbUser.displayName || fbUser.email?.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase(),
        fullName: fbUser.displayName || 'Google User',
        callsign: fbUser.displayName ? fbUser.displayName.toUpperCase().slice(0, 12) : null,
        clearanceLevel: 'TOP_SECRET',
        isActive: true,
        isEmailVerified: fbUser.emailVerified,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      // Sync user profile document in Firestore (/users/{userId})
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const existingDoc = await getDoc(userDocRef);
        const now = new Date().toISOString();
        if (!existingDoc.exists()) {
          await setDoc(userDocRef, {
            userId: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || '',
            username: normalizedUser.username,
            callsign: normalizedUser.callsign || '',
            clearanceLevel: 'TOP_SECRET',
            createdAt: now,
          });
        }
      } catch (firestoreErr) {
        console.warn('Firestore profile sync note:', firestoreErr);
      }

      const token = await fbUser.getIdToken();
      this.persistSession(token, normalizedUser, true);
      return normalizedUser;
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        throw {
          status: 400,
          message: 'Sign in was cancelled.',
        } as AuthError;
      }
      throw {
        status: 500,
        message: err.message || 'Firebase Google authentication failed.',
      } as AuthError;
    }
  }

  /**
   * Request Password Reset (POST /api/v1/auth/forgot-password)
   */
  public async forgotPassword(email: string): Promise<{ message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw {
        status: 422,
        message: 'Enter a valid email address.',
        field: 'email',
      } as AuthError;
    }

    try {
      const res = await defaultApiClient.post<{ message: string }>(
        '/auth/forgot-password',
        { email: cleanEmail },
        { skipAuth: true }
      );
      return res;
    } catch (err: any) {
      throw normalizeAuthError(err);
    }
  }

  /**
   * Reset Password with Token (POST /api/v1/auth/reset-password)
   */
  public async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    if (!token) {
      throw {
        status: 422,
        message: 'Reset token is required.',
      } as AuthError;
    }
    if (!newPassword || newPassword.length < 8) {
      throw {
        status: 422,
        message: 'Password must be at least 8 characters long.',
      } as AuthError;
    }

    try {
      const res = await defaultApiClient.post<{ message: string }>(
        '/auth/reset-password',
        { token, new_password: newPassword },
        { skipAuth: true }
      );
      return res;
    } catch (err: any) {
      throw normalizeAuthError(err);
    }
  }

  /**
   * Resend Verification Email (POST /api/v1/auth/resend-verification)
   */
  public async resendVerification(email: string): Promise<{ message: string }> {
    try {
      return await defaultApiClient.post<{ message: string }>(
        '/auth/resend-verification',
        { email: email.trim().toLowerCase() },
        { skipAuth: true }
      );
    } catch (err: any) {
      throw normalizeAuthError(err);
    }
  }

  /**
   * Verify Email Code (POST /api/v1/auth/verify-email)
   */
  public async verifyEmail(email: string, code: string): Promise<{ message: string; user?: User }> {
    try {
      const response = await defaultApiClient.post<any>(
        '/auth/verify-email',
        { email: email.trim().toLowerCase(), code },
        { skipAuth: true }
      );
      if (response.user) {
        const user = normalizeUser(response.user);
        this.inMemoryUser = user;
        this.notify();
      }
      return response;
    } catch (err: any) {
      throw normalizeAuthError(err);
    }
  }

  /**
   * Get Current Operator Profile (GET /api/v1/auth/me)
   */
  public async getMe(providedToken?: string): Promise<User> {
    const token = providedToken || this.getToken();

    if (!token) {
      throw {
        status: 401,
        message: 'Your session has expired. Please sign in again.',
      } as AuthError;
    }

    if (providedToken) {
      defaultApiClient.setToken(providedToken);
    }

    try {
      const response = await defaultApiClient.get<any>('/auth/me');
      const normalized = normalizeUser(response);
      this.inMemoryUser = normalized;
      return normalized;
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        this.logout();
      }
      throw normalizeAuthError(err);
    }
  }

  /**
   * Passkey / WebAuthn Device Check
   */
  public async isPasskeySupported(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (window.PublicKeyCredential && typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      try {
        return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Log out and terminate active session
   */
  public logout(): void {
    this.inMemoryToken = null;
    this.inMemoryUser = null;
    defaultApiClient.setToken(null);

    // Safely sign out of Firebase auth if active
    try {
      import('./firebase').then(({ auth }) => {
        if (auth.currentUser) {
          import('firebase/auth').then(({ signOut }) => signOut(auth).catch(() => {}));
        }
      }).catch(() => {});
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_REMEMBER);
        sessionStorage.removeItem(STORAGE_KEY_TOKEN);
        sessionStorage.removeItem(STORAGE_KEY_USER);
      } catch {}
    }

    this.notify();
  }

  /**
   * Reset to demo users (used in testing)
   */
  public resetToDemoUsers(): void {
    this.logout();
  }
}

export const authService = new AuthService();
