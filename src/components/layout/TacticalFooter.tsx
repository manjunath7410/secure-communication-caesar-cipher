import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface FooterProps {
  lastCheckedTime?: string;
}

export const TacticalFooter: React.FC<FooterProps> = ({ lastCheckedTime }) => {
  return (
    <footer
      id="app-footer"
      className="hidden md:flex h-10 border-t border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-950 px-6 items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 shrink-0 select-none transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
        <span>Educational Cryptography Tool</span>
        <span className="text-neutral-300 dark:text-neutral-700">•</span>
        <span>Zero-plaintext storage</span>
      </div>

      <div className="flex items-center gap-4">
        <span>For learning &amp; research only</span>
        {lastCheckedTime && (
          <span className="text-neutral-400 dark:text-neutral-500 font-mono text-[11px]">
            Synced {lastCheckedTime}
          </span>
        )}
      </div>
    </footer>
  );
};
