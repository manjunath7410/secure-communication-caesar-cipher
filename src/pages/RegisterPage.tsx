import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AppView } from '../types/navigation';
import { AuthError } from '../types/auth';
import { Logo } from '../components/branding/Logo';

interface RegisterPageProps {
  onNavigate: (view: AppView) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate, onToast }) => {
  const { register, resendVerification, verifyEmail } = useAuth();

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation & Loading
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Verification Step State
  const [isAwaitingVerification, setIsAwaitingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  // Timer effect for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Calculate Password Strength
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { label: 'Weak', percent: 33, color: 'bg-red-500', text: 'text-red-500' };
    if (score <= 4) return { label: 'Fair', percent: 66, color: 'bg-amber-500', text: 'text-amber-500' };
    return { label: 'Strong', percent: 100, color: 'bg-emerald-500', text: 'text-emerald-500' };
  };

  const strength = calculatePasswordStrength(password);

  const validate = (): boolean => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setConfirmError(null);
    setErrorMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      isValid = false;
    }

    if (!password || password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      isValid = false;
    }

    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match.');
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
      const res = await register({
        fullName: fullName.trim() || email.split('@')[0],
        email: email.trim(),
        password,
        username: email.split('@')[0],
      });

      setIsSuccess(true);
      onToast?.('success', 'Account Created', 'Please verify your email address to continue.');

      if (res.requiresVerification) {
        setIsAwaitingVerification(true);
        setResendCooldown(30);
      } else {
        setTimeout(() => {
          onNavigate('home');
        }, 500);
      }
    } catch (err: unknown) {
      const authErr = err as AuthError;
      setErrorMessage(authErr.message || 'Registration failed. Please check inputs.');
      onToast?.('error', 'Registration Failed', authErr.message || 'Unable to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (codeToVerify?: string) => {
    const code = codeToVerify || verificationCode;
    if (!code.trim()) {
      setErrorMessage('Please enter the verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      await verifyEmail(email, code);
      onToast?.('success', 'Email Verified', 'Your account is fully active.');
      onNavigate('home');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired verification code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await resendVerification(email);
      setResendCooldown(30);
      onToast?.('info', 'Code Resent', 'A new verification code has been dispatched.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend verification email.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-14 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-3 flex flex-col items-center">
        <Logo size="xl" variant="default" id="register-brand-logo" />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            {isAwaitingVerification ? 'Verify your email' : 'Create your account'}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {isAwaitingVerification
              ? `We sent a confirmation code to ${email}`
              : 'Secure Communication · Caesar Cipher Educational Tool'}
          </p>
        </div>
      </div>

      {/* Main Registration Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5 transition-colors">
        {/* Verification Screen */}
        {isAwaitingVerification ? (
          <div className="space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="flex-1 font-medium">{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="verification-code"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
              >
                Verification code
              </label>
              <input
                id="verification-code"
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code"
                className="w-full text-center tracking-widest text-lg font-mono py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={() => handleVerifyCode()}
              disabled={isVerifying || !verificationCode}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify Email</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Instant Demo Confirmation Option */}
            <button
              type="button"
              onClick={() => handleVerifyCode('demo')}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant demo verification</span>
            </button>

            {/* Resend & Edit Email Controls */}
            <div className="pt-2 flex items-center justify-between text-xs text-neutral-500">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
              <button
                type="button"
                onClick={() => setIsAwaitingVerification(false)}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                Change email
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="flex-1 font-medium">{errorMessage}</span>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1">
              <label
                htmlFor="register-fullname"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
              >
                Full name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="register-fullname"
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label
                htmlFor="register-email"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border ${
                    emailError
                      ? 'border-red-500 focus:ring-red-500/20'
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

            {/* Password */}
            <div className="space-y-1">
              <label
                htmlFor="register-password"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="At least 8 characters"
                  className={`w-full pl-10 pr-10 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border ${
                    passwordError
                      ? 'border-red-500 focus:ring-red-500/20'
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

              {/* Password Strength Meter */}
              {password && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-500">Strength:</span>
                    <span className={`font-medium ${strength.text}`}>{strength.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: `${strength.percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label
                htmlFor="register-confirm-password"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
              >
                Confirm password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmError) setConfirmError(null);
                  }}
                  placeholder="Re-enter password"
                  className={`w-full pl-10 pr-10 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border ${
                    confirmError
                      ? 'border-red-500 focus:ring-red-500/20'
                      : 'border-neutral-200 dark:border-neutral-800 focus:ring-blue-500/20 focus:border-blue-500'
                  } text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 absolute right-1 top-1/2 -translate-y-1/2 rounded-lg transition-colors cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmError && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {confirmError}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="register-submit-btn"
              disabled={isSubmitting || isSuccess}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Account Created ✓</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="text-center text-xs text-neutral-500">
        Already have an account?{' '}
        <button
          type="button"
          id="login-navigate-link"
          onClick={() => onNavigate('login')}
          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
        >
          Sign in
        </button>
      </div>
    </div>
  );
};
