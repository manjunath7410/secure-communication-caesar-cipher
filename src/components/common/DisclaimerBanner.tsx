import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const DisclaimerBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl ${className}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-[11px] text-amber-800 dark:text-amber-300 uppercase tracking-wider font-bold">
          Academic Warning
        </p>
      </div>
      <p className="text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-200/70">
        Caesar Cipher is a classical substitution cipher with zero modern computational security (keyspace = 26). For educational use only.
      </p>
    </div>
  );
};
