import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'operational' | 'ready' | 'pending_phase' | 'degraded';
  label?: string;
  showDot?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showDot = true,
}) => {
  const config = {
    operational: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', defaultLabel: 'OPERATIONAL' },
    ready: { dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', defaultLabel: 'READY' },
    pending_phase: { dot: 'bg-neutral-400', text: 'text-neutral-600 dark:text-neutral-400', defaultLabel: 'SCHEDULED' },
    degraded: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', defaultLabel: 'DEGRADED' },
  }[status];

  return (
    <span className="inline-flex items-center space-x-1.5 text-xs uppercase tracking-wider font-semibold">
      {showDot && <span className={`w-2 h-2 rounded-full ${config.dot}`} />}
      <span className={config.text}>{label || config.defaultLabel}</span>
    </span>
  );
};

export const DisclaimerBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-4 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl ${className}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-xs text-amber-800 dark:text-amber-300 uppercase tracking-wider font-bold">
          Academic Cryptography Notice
        </p>
      </div>
      <p className="text-xs leading-relaxed text-amber-900/80 dark:text-amber-200/70 font-normal">
        CAESAR CIPHER IS A CLASSICAL SUBSTITUTION CIPHER WITH ZERO MODERN COMPUTATIONAL SECURITY (KEYSPACE = 26). THIS PLATFORM IS AN EDUCATIONAL RESEARCH AND CRYPTANALYSIS DEMONSTRATION ONLY.
      </p>
    </div>
  );
};
