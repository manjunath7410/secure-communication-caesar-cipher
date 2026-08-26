import React, { useState } from 'react';
import {
  User,
  Shield,
  Mail,
  KeyRound,
  LogOut,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AppView } from '../types/navigation';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal';

interface AccountPageProps {
  onNavigate: (view: AppView) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate, onToast }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center mx-auto">
          <User className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
          Not Signed In
        </h2>
        <p className="text-xs text-neutral-500 max-w-xs mx-auto">
          Sign in to access your personal encrypted message history and account settings.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Account Overview Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-xs">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {user.fullName || user.username}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {user.email}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            logout();
            onToast?.('info', 'Signed Out', 'You have been signed out.');
            onNavigate('home');
          }}
          className="flex items-center gap-2 py-2 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-neutral-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 text-xs font-medium transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Account Details Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Security / Clearance Level */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Clearance Level
            </span>
          </div>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {user.clearanceLevel || 'SECRET'}
          </p>
          <p className="text-[11px] text-neutral-500">
            Enables full authenticated message vault and historical frequency analytics.
          </p>
        </div>

        {/* Email Verification Status */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Account Status
            </span>
          </div>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Active & Verified
          </p>
          <p className="text-[11px] text-neutral-500">
            Zero-plaintext storage guarantee active across all encrypted sessions.
          </p>
        </div>
      </div>

      {/* Profile Information List */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
          Account Information
        </h3>

        <div className="space-y-3 divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
          <div className="flex items-center justify-between pt-2">
            <span className="text-neutral-500 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Email
            </span>
            <span className="font-mono text-neutral-900 dark:text-neutral-100">{user.email}</span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <span className="text-neutral-500 flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Username / ID
            </span>
            <span className="font-mono text-neutral-900 dark:text-neutral-100">{user.username}</span>
          </div>

          <div className="flex items-center justify-between pt-3">
            <span className="text-neutral-500 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Member Since
            </span>
            <span className="text-neutral-900 dark:text-neutral-100">
              {new Date(user.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Security Actions */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
          Security & Password
        </h3>
        <p className="text-xs text-neutral-500">
          Manage your password or request security credential updates.
        </p>
        <button
          type="button"
          onClick={() => setShowPasswordModal(true)}
          className="flex items-center gap-2 py-2 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
        >
          <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Reset Password</span>
        </button>
      </div>

      <ForgotPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onToast={onToast}
      />
    </div>
  );
};
