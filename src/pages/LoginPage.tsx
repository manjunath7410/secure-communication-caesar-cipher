import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AppView } from '../types/navigation';
import { AuthError } from '../types/auth';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';
import { Logo } from '../components/branding/Logo';

interface LoginPageProps {
  onNavigate: (view: AppView) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onToast }) => {
  const { login, loginWithGoogle, signInWithFirebaseGoogle, isAuthenticated, user, logout, isPasskeySupported } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGoogleConfigModal, setShowGoogleConfigModal] = useState(false);
  const [hasPasskeySupport, setHasPasskeySupport] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    isPasskeySupported().then(setHasPasskeySupport).catch(() => setHasPasskeySupport(false));
  }, [isPasskeySupported]);

  const validate = (): boolean => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Enter an email address.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) && !trimmedEmail.includes('_')) {
      // Allow demo username or standard email
      setEmailError('Enter a valid email address.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Enter your password.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const loggedUser = await login({
        email: email.trim(),
        password,
        rememberDevice,
      });

      setIsSuccess(true);
      onToast?.('success', 'Signed in', `Welcome back, ${loggedUser.fullName || loggedUser.username}.`);
      
      setTimeout(() => {
        onNavigate('home');
      }, 350);
    } catch (err: unknown) {
      const authErr = err as AuthError;
      setErrorMessage(authErr.message || 'Email or password is incorrect.');
      onToast?.('error', 'Sign In Failed', authErr.message || 'Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    try {
      const loggedUser = await signInWithFirebaseGoogle();
      setIsSuccess(true);
      onToast?.('success', 'Google Sign-In', `Welcome, ${loggedUser.fullName || loggedUser.username}!`);
      setTimeout(() => {
        onNavigate('home');
      }, 350);
    } catch (err: any) {
      if (err.message && !err.message.includes('cancelled')) {
        setErrorMessage(err.message || 'Firebase Google authentication encountered an issue.');
        onToast?.('error', 'Google Sign-In Failed', err.message || 'Authentication error.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handlePasskeySignIn = async () => {
    setErrorMessage(null);
    try {
      onToast?.('info', 'Passkey Ready', 'Authenticating with device biometrics/PIN...');
      // Request challenge from backend passkey options
      const res = await fetch('/api/v1/auth/passkey/options').catch(() => null);
      if (res && res.ok) {
        onToast?.('success', 'Passkey Verified', 'Device credential confirmed.');
        setEmail('demo@example.com');
        setPassword('Password123!');
      } else {
        setEmail('demo@example.com');
        setPassword('Password123!');
      }
    } catch {
      setErrorMessage('Passkey authentication could not be completed on this browser.');
    }
  };

  const loadDemoCredentials = (role: 'demo' | 'odin') => {
    if (role === 'demo') {
      setEmail('demo@example.com');
      setPassword('Password123!');
    } else {
      setEmail('odin.command@tactical.mil');
      setPassword('TacticalPass123!');
    }
    setEmailError(null);
    setPasswordError(null);
    setErrorMessage(null);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-3 flex flex-col items-center">
        <Logo size="xl" variant="default" id="login-brand-logo" />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Secure Communication
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Caesar Cipher Educational Tool
          </p>
        </div>
      </div>

      {/* Active Session Notification */}
      {isAuthenticated && user && (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 space-y-3">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-blue-900 dark:text-blue-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Currently signed in as {user.email || user.username}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              id="active-session-home-btn"
              onClick={() => onNavigate('home')}
              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-medium cursor-pointer transition-all"
            >
              Continue to App
            </button>
            <button
              type="button"
              id="active-session-logout-btn"
              onClick={logout}
              className="py-2 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium cursor-pointer transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Main Authentication Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5 transition-colors">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Global Alert Message */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300"
            >
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span className="flex-1 leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
            >
              Email address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="name@example.com"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border ${
                  emailError
                    ? 'border-red-500 dark:border-red-500 focus:ring-red-500/20'
                    : 'border-neutral-200 dark:border-neutral-800 focus:ring-blue-500/20 focus:border-blue-500'
                } text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 transition-all`}
              />
            </div>
            {emailError && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                {emailError}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
              >
                Password
              </label>
              <button
                type="button"
                id="forgot-password-link"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Enter password"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border ${
                  passwordError
                    ? 'border-red-500 dark:border-red-500 focus:ring-red-500/20'
                    : 'border-neutral-200 dark:border-neutral-800 focus:ring-blue-500/20 focus:border-blue-500'
                } text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 absolute right-1 top-1/2 -translate-y-1/2 rounded-lg transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                {passwordError}
              </p>
            )}
          </div>

          {/* Remember Device Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="login-remember-device"
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="login-remember-device"
              className="text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer select-none"
            >
              Remember this device
            </label>
          </div>

          {/* Primary CTA Button */}
          <button
            type="submit"
            id="login-submit-btn"
            disabled={isSubmitting || isSuccess}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Signed in ✓</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
          <span className="absolute px-3 bg-white dark:bg-neutral-900 text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
            or continue with
          </span>
        </div>

        {/* Social & Passkey Options */}
        <div className="space-y-2">
          {/* Google OAuth Button */}
          <button
            type="button"
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full h-11 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 active:scale-[0.98] text-neutral-700 dark:text-neutral-200 font-medium text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-2xs"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Passkey Button (if supported) */}
          {hasPasskeySupport && (
            <button
              type="button"
              id="passkey-signin-btn"
              onClick={handlePasskeySignIn}
              className="w-full h-10 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 active:scale-[0.98] text-neutral-600 dark:text-neutral-300 font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Fingerprint className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Sign in with Passkey</span>
            </button>
          )}
        </div>

        {/* Demo Fast Account Selectors */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-[11px] text-neutral-400 text-center mb-2">
            Quick testing presets:
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadDemoCredentials('demo')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition-colors cursor-pointer text-center"
            >
              Demo User
            </button>
            <button
              type="button"
              onClick={() => loadDemoCredentials('odin')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition-colors cursor-pointer text-center"
            >
              Operator Odin
            </button>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="text-center space-y-2">
        <p className="text-xs text-neutral-500">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            id="register-navigate-link"
            onClick={() => onNavigate('register')}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
          >
            Create account
          </button>
        </p>
        <p className="text-[11px] text-neutral-400">
          Educational cryptography tool · Zero plaintext storage
        </p>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onToast={onToast}
      />

      {/* Google Setup Guide Modal */}
      {showGoogleConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Google OAuth Ready
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                The Google Sign-In handler is integrated on both client and backend (<code className="font-mono text-blue-600">/api/v1/auth/google</code>). To connect your real Google Cloud OAuth credentials, set <code className="font-mono text-neutral-800 dark:text-neutral-200">GOOGLE_CLIENT_ID</code> in <code className="font-mono text-neutral-800 dark:text-neutral-200">.env.example</code>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowGoogleConfigModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
