/**
 * @file auth.ts
 * @description Type definitions for Modern Authentication, JWT Tokens, and User Sessions.
 */

export type ClearanceLevel = 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';

export interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  callsign?: string | null;
  clearanceLevel: ClearanceLevel;
  isActive: boolean;
  isEmailVerified?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
  requiresVerification?: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName?: string;
  username?: string;
  callsign?: string;
  clearanceLevel?: ClearanceLevel;
}

export interface LoginPayload {
  email?: string;
  username?: string;
  password: string;
  rememberDevice?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthError {
  status: number;
  message: string;
  field?: string;
  isNetworkError?: boolean;
  code?: string;
}
