/**
 * @file AuthContext.tsx
 * @description React Context providing global user authentication, session management,
 * Google Identity Services (GSI) OIDC token exchange, URL redirection recovery, and Firestore synchronization.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, LoginPayload, RegisterPayload, AuthState } from '../types/auth';
import { authService } from '../services/authService';
import { testFirestoreConnection, auth, db, firebaseConfig } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<{ user: User; requiresVerification?: boolean }>;
  loginWithGoogle: (credential: string) => Promise<User>;
  signInWithFirebaseGoogle: (credential?: string) => Promise<User>;
  signInWithGoogleDemo: (preset?: 'developer' | 'operator') => Promise<User>;
  handleCredentialExchange: (credential: string) => Promise<User>;
  renderGoogleButton: (element: HTMLElement | null, options?: any) => void;
  promptGoogleOneTap: () => void;
  isGsiReady: boolean;
  gsiError: string | null;
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
  const [isGsiReady, setIsGsiReady] = useState<boolean>(false);
  const [gsiError, setGsiError] = useState<string | null>(null);

  const syncState = useCallback(() => {
    setUser(authService.getCurrentUser());
    setToken(authService.getToken());
  }, []);

  /**
   * Unified OIDC Credential Token Exchange
   * Exchanges Google ID Token with both Firebase Auth and Backend API (/api/v1/auth/google)
   */
  const handleCredentialExchange = useCallback(async (credential: string): Promise<User> => {
    setIsLoading(true);
    setGsiError(null);
    try {
      let fbUser: User | null = null;
      // 1. Firebase Auth Exchange & Firestore Profile Synchronization
      try {
        fbUser = await authService.signInWithFirebaseGoogle(credential);
      } catch (fbErr: any) {
        console.warn('Firebase credential exchange notice:', fbErr);
      }

      // 2. Backend REST API Token Exchange (/api/v1/auth/google or /auth/google)
      let backendUser: User | null = null;
      try {
        const backendRes = await authService.loginWithGoogle(credential);
        backendUser = backendRes.user;
        setToken(backendRes.accessToken);
      } catch (beErr: any) {
        console.warn('Backend OAuth token exchange notice:', beErr);
      }

      const activeUser = fbUser || backendUser;
      if (!activeUser) {
        throw new Error('Could not validate Google credentials with authentication services.');
      }

      setUser(activeUser);
      setToken(authService.getToken());
      return activeUser;
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to exchange Google token.';
      setGsiError(errMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Google Identity Services (GSI) Initializer
   */
  const initGsi = useCallback(() => {
    if (typeof window === 'undefined') return;
    const google = (window as any).google;
    if (!google?.accounts?.id) return;

    try {
      const oAuthClientId =
        (firebaseConfig as any).oAuthClientId ||
        '831860067274-569hk73skqhgblqbkjkmdp2ujmc38uc0.apps.googleusercontent.com';

      google.accounts.id.initialize({
        client_id: oAuthClientId,
        callback: async (response: { credential?: string; select_by?: string }) => {
          if (response?.credential) {
            try {
              await handleCredentialExchange(response.credential);
            } catch (err: any) {
              console.error('GSI credential exchange failed:', err);
            }
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        itp_support: true,
        context: 'signin',
      });

      setIsGsiReady(true);
      setGsiError(null);

      // Declarative callback for index.html or Google rendered buttons
      (window as any).handleGoogleCredentialResponse = async (response: any) => {
        if (response?.credential) {
          await handleCredentialExchange(response.credential);
        }
      };
    } catch (err: any) {
      console.warn('GSI initialize notice:', err);
      setGsiError(err?.message || 'Could not initialize Google Identity Services.');
    }
  }, [handleCredentialExchange]);

  // Hook into Google Identity Services Script Lifecycle
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).google?.accounts?.id) {
      initGsi();
    } else {
      const handleGsiLoaded = () => initGsi();
      window.addEventListener('google-gsi-loaded', handleGsiLoaded);

      // Polling fallback if script takes a few moments to evaluate
      const interval = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          initGsi();
          clearInterval(interval);
        }
      }, 250);

      const timeout = setTimeout(() => {
        clearInterval(interval);
      }, 5000);

      return () => {
        window.removeEventListener('google-gsi-loaded', handleGsiLoaded);
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [initGsi]);

  const renderGoogleButton = useCallback((element: HTMLElement | null, options?: any) => {
    if (!element || typeof window === 'undefined') return;
    const google = (window as any).google;
    if (google?.accounts?.id) {
      try {
        element.innerHTML = '';
        google.accounts.id.renderButton(element, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: '100%',
          ...options,
        });
      } catch (e) {
        console.warn('Google renderButton note:', e);
      }
    }
  }, []);

  const promptGoogleOneTap = useCallback(() => {
    if (typeof window === 'undefined') return;
    const google = (window as any).google;
    if (google?.accounts?.id) {
      try {
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.info('Google One Tap notification status:', notification.getNotDisplayedReason());
          }
        });
      } catch (e) {
        console.warn('Google prompt note:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Test Firebase Firestore connection on initial boot
    testFirestoreConnection().catch(() => {});

    // Listen to Firebase Auth state
    const unsubscribeFb = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDocSnap = await getDoc(userDocRef).catch(() => null);
          const profileData = userDocSnap && userDocSnap.exists() ? userDocSnap.data() : null;

          const activeUser: User = {
            id: fbUser.uid,
            email: fbUser.email || '',
            username: profileData?.username || (fbUser.displayName || fbUser.email?.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase(),
            fullName: profileData?.displayName || fbUser.displayName || 'Google User',
            callsign: profileData?.callsign || (fbUser.displayName ? fbUser.displayName.toUpperCase().slice(0, 12) : null),
            clearanceLevel: profileData?.clearanceLevel || 'TOP_SECRET',
            isActive: true,
            isEmailVerified: fbUser.emailVerified,
            createdAt: profileData?.createdAt || new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };

          if (!userDocSnap || !userDocSnap.exists()) {
            await setDoc(userDocRef, {
              userId: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || '',
              username: activeUser.username,
              callsign: activeUser.callsign || '',
              clearanceLevel: 'TOP_SECRET',
              createdAt: activeUser.createdAt,
            }).catch(() => {});
          }

          const idToken = await fbUser.getIdToken().catch(() => null);
          if (idToken) {
            setToken(idToken);
          }
          setUser(activeUser);
        } catch (err) {
          console.warn('Error synchronizing Firebase user profile:', err);
        }
      }
    });

    // Check incoming URL parameters from Google redirection / OIDC redirect
    const handleUrlRedirects = async () => {
      if (typeof window === 'undefined') return;

      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(
        window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash
      );

      const credentialFromUrl =
        urlParams.get('credential') ||
        urlParams.get('id_token') ||
        urlParams.get('token') ||
        hashParams.get('credential') ||
        hashParams.get('id_token') ||
        hashParams.get('token');

      const googleAuthError = urlParams.get('google_auth_error');
      const authSuccess = urlParams.get('auth_success') || hashParams.get('auth_success');

      if (googleAuthError) {
        setGsiError(`Google Sign-In notice: ${googleAuthError.replace(/_/g, ' ')}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (credentialFromUrl) {
        // Strip credential from browser address bar immediately for security
        window.history.replaceState({}, document.title, window.location.pathname);
        try {
          await handleCredentialExchange(credentialFromUrl);
        } catch (err) {
          console.error('URL credential exchange error:', err);
        }
      } else if (authSuccess) {
        window.history.replaceState({}, document.title, window.location.pathname);
        syncState();
      }
    };

    handleUrlRedirects();

    // Initial verification of stored token
    const initAuth = async () => {
      try {
        const activeToken = authService.getToken();
        if (activeToken) {
          const verifiedUser = await authService.getMe(activeToken);
          setUser(verifiedUser);
        } else if (!auth.currentUser) {
          setUser(null);
        }
      } catch {
        if (!auth.currentUser) {
          authService.logout();
          setUser(null);
          setToken(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
    const unsubscribeService = authService.subscribe(syncState);
    return () => {
      unsubscribeFb();
      unsubscribeService();
    };
  }, [syncState, handleCredentialExchange]);

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
    return await handleCredentialExchange(credential);
  };

  const signInWithFirebaseGoogle = async (credential?: string): Promise<User> => {
    if (credential) {
      return await handleCredentialExchange(credential);
    }

    setIsLoading(true);
    try {
      const u = await authService.signInWithFirebaseGoogle(credential);
      setUser(u);
      setToken(authService.getToken());
      return u;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogleDemo = async (preset: 'developer' | 'operator' = 'developer'): Promise<User> => {
    setIsLoading(true);
    try {
      const u = await authService.signInWithGoogleDemo(preset);
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
        signInWithFirebaseGoogle,
        signInWithGoogleDemo,
        handleCredentialExchange,
        renderGoogleButton,
        promptGoogleOneTap,
        isGsiReady,
        gsiError,
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

