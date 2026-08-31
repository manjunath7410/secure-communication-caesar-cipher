/**
 * @file AuthContext.tsx
 * @description React Context providing global user authentication and session management.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, LoginPayload, RegisterPayload, AuthState } from '../types/auth';
import { authService } from '../services/authService';
import { testFirestoreConnection } from '../services/firebase';

interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<{ user: User; requiresVerification?: boolean }>;
  loginWithGoogle: (credential: string) => Promise<User>;
  signInWithFirebaseGoogle: () => Promise<User>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (token: string, newPass: string) => Promise<{ message: string }>;
  resendVerification: (email: string) => Promise<{ message: string }>;
  verifyEmail: (email: string, code: string) => Promise<{ message: string }>;
  logout: () => void;
  refreshMe: () => Promise<User | null>;
  isPasskeySupported: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [token, setToken] = useState<string | null>(() => authService.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncState = useCallback(() => {
    setUser(authService.getCurrentUser());
    setToken(authService.getToken());
  }, []);

  useEffect(() => {
    // Test Firebase Firestore connection on initial boot
    testFirestoreConnection().catch(() => {});

    // Initial verification of stored token
    const initAuth = async () => {
      try {
        const activeToken = authService.getToken();
        if (activeToken) {
          const verifiedUser = await authService.getMe(activeToken);
          setUser(verifiedUser);
        } else {
          setUser(null);
        }
      } catch {
        authService.logout();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
    const unsubscribe = authService.subscribe(syncState);
    return () => unsubscribe();
  }, [syncState]);

  const login = async (payload: LoginPayload): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.login(payload);
      setUser(response.user);
      setToken(response.accessToken);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<{ user: User; requiresVerification?: boolean }> => {
    setIsLoading(true);
    try {
      const response = await authService.register(payload);
      setUser(response.user);
      setToken(response.accessToken);
      return { user: response.user, requiresVerification: response.requiresVerification };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.loginWithGoogle(credential);
      setUser(response.user);
      setToken(response.accessToken);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithFirebaseGoogle = async (): Promise<User> => {
    setIsLoading(true);
    try {
      const u = await authService.signInWithFirebaseGoogle();
      setUser(u);
      setToken(authService.getToken());
      return u;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    return await authService.forgotPassword(email);
  };

  const resetPassword = async (token: string, newPass: string) => {
    return await authService.resetPassword(token, newPass);
  };

  const resendVerification = async (email: string) => {
    return await authService.resendVerification(email);
  };

  const verifyEmail = async (email: string, code: string) => {
    const res = await authService.verifyEmail(email, code);
    if (res.user) {
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const refreshMe = async (): Promise<User | null> => {
    try {
      const activeToken = authService.getToken();
      if (!activeToken) return null;
      const verified = await authService.getMe(activeToken);
      setUser(verified);
      return verified;
    } catch {
      logout();
      return null;
    }
  };

  const isPasskeySupported = async (): Promise<boolean> => {
    return await authService.isPasskeySupported();
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        register,
        loginWithGoogle,
        forgotPassword,
        resetPassword,
        resendVerification,
        verifyEmail,
        logout,
        refreshMe,
        isPasskeySupported,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
