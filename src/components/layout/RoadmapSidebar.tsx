import React from 'react';
import { Layers } from 'lucide-react';
import { SYSTEM_PHASES } from '../../utils/constants';
import { DisclaimerBanner } from '../common/DisclaimerBanner';

interface RoadmapSidebarProps {
  currentPhaseId?: string;
  onSelectPhase?: (phaseId: string) => void;
}

export const RoadmapSidebar: React.FC<RoadmapSidebarProps> = ({
  currentPhaseId = 'p1',
  onSelectPhase,
}) => {
  return (
    <aside className="border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 lg:p-6 flex flex-col h-full overflow-hidden transition-colors">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
          <Layers className="w-3.5 h-3.5" /> Project Roadmap
        </h2>
        <span className="text-xs text-neutral-400 font-medium">20 PHASES</span>
      </div>

      <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 font-sans">
        {SYSTEM_PHASES.map((phase) => {
          const isCurrent = phase.id === currentPhaseId || phase.status === 'in_progress';
          const isDone = phase.status === 'completed';

          return (
            <div
              key={phase.id}
              onClick={() => onSelectPhase?.(phase.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 opacity-100 shadow-xs'
                  : isDone
                  ? 'bg-neutral-50/70 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800 opacity-90'
                  : 'bg-transparent border-transparent opacity-50 hover:opacity-80 hover:bg-neutral-50 dark:hover:bg-neutral-800/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{phase.code}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-medium ${
                    isDone
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : isCurrent
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-neutral-500'
                  }`}
                >
                  {isDone ? 'COMPLETE' : isCurrent ? 'ACTIVE' : 'UPCOMING'}
                </span>
              </div>
              <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mt-1">{phase.title}</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2 leading-snug">
                {phase.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
        <DisclaimerBanner />
      </div>
    </aside>
  );
};
