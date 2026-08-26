/**
 * @file ClearanceGate.tsx
 * @description Tactical clearance guard shown when unauthenticated operators attempt to access protected resources.
 */

import React from 'react';
import { ShieldAlert, KeyRound, UserPlus, Zap } from 'lucide-react';
import { AppView } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';

interface ClearanceGateProps {
  title?: string;
  description?: string;
  onNavigate: (view: AppView) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const ClearanceGate: React.FC<ClearanceGateProps> = ({
  title = 'Tactical Security Clearance Required',
  description = 'This operational terminal requires authenticated cryptographic operator clearance (Phase 6 JWT clearance token).',
  onNavigate,
  onToast,
}) => {
  const { login } = useAuth();

  const handleQuickDemoUnlock = async () => {
    try {
      const u = await login({ username: 'operator_odin', password: 'TacticalPass123!' });
      onToast?.('success', 'Clearance Granted', `Unlocked demo operator session: ${u.callsign} [${u.clearanceLevel}]`);
    } catch {
      onNavigate('login');
    }
  };

  return (
    <div className="p-6 sm:p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center space-y-5 rounded-2xl shadow-xs max-w-xl mx-auto my-6 transition-colors">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-600 dark:text-amber-400">
        <ShieldAlert className="w-7 h-7" />
      </div>

      <div className="space-y-1.5 font-sans">
        <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          Authentication Required
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => onNavigate('login')}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <KeyRound className="w-4 h-4" /> Operator Login
        </button>

        <button
          onClick={() => onNavigate('register')}
          className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700/70 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Enlist New Account
        </button>
      </div>

      <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <button
          onClick={handleQuickDemoUnlock}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1.5 font-semibold transition-colors cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5" />
          Instant Unlock with Demo Operator (ODIN-1 // TOP_SECRET)
        </button>
      </div>
    </div>
  );
};
