import React, { useState } from 'react';
import {
  Activity,
  Lock,
  Unlock,
  Copy,
  Check,
  RotateCcw,
  Clock,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { OperationActivity } from '../../services/activityStore';
import { copyToClipboard } from '../../utils/clipboard';
import { AppView } from '../../types/navigation';

interface RecentActivityFeedProps {
  activities: OperationActivity[];
  onClearLog: () => void;
  onResetToDemo: () => void;
  onNavigate: (view: AppView) => void;
  onToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
  className?: string;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
  onClearLog,
  onResetToDemo,
  onNavigate,
  onToast,
  className = '',
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatTimestamp = (ts: number): string => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleCopyOutput = async (id: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      onToast('success', 'Output Copied', `Copied payload (${text.length} chars) to clipboard.`);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      onToast('error', 'Copy Failed', 'Unable to access clipboard.');
    }
  };

  return (
    <div
      id="recent-activity-panel"
      className={`p-5 bg-[#0D0E0A] border border-[#2A2D24] rounded-xs space-y-4 font-mono ${className}`}
    >
      {/* Header with Title and Reset Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F221A] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#A3B18A]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A3B18A]">
            Recent Cryptographic Activity
          </h3>
          <span className="text-[10px] text-neutral-400 bg-[#141611] px-2 py-0.5 border border-[#2A2D24] rounded-xs">
            {activities.length} Recorded
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="reset-demo-activity-btn"
            type="button"
            onClick={onResetToDemo}
            className="px-2.5 py-1 text-[10px] bg-[#141611] hover:bg-[#1A1C16] border border-[#2A2D24] hover:border-neutral-500 text-neutral-300 rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
            title="Reload realistic sample activity data"
          >
            <RotateCcw className="w-3 h-3" /> Reset Demo Seed
          </button>

          {activities.length > 0 && (
            <button
              id="clear-activity-log-btn"
              type="button"
              onClick={onClearLog}
              className="px-2.5 py-1 text-[10px] bg-[#141611] hover:bg-red-950/40 border border-[#2A2D24] hover:border-red-500/40 text-neutral-400 hover:text-red-300 rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
              title="Clear all recorded entries"
            >
              <Trash2 className="w-3 h-3" /> Clear Log
            </button>
          )}
        </div>
      </div>

      {/* Activity List Container */}
      {activities.length === 0 ? (
        <div className="p-8 border border-dashed border-[#1F221A] rounded-xs text-center space-y-2">
          <p className="text-xs text-neutral-500 italic">
            No recent cryptographic activity recorded in local session memory.
          </p>
          <p className="text-[10px] text-neutral-600">
            Execute a Quick Encrypt, Quick Decrypt, or full cipher operation to generate entries.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {activities.map((act) => {
            const isEncrypt = act.type === 'ENCRYPT';
            const isCopied = copiedId === act.id;

            return (
              <div
                key={act.id}
                id={`activity-item-${act.id}`}
                className="p-3 bg-[#070805] border border-[#1F221A] hover:border-[#2A2D24] rounded-xs transition-colors space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {isEncrypt ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 rounded-xs uppercase">
                        <Lock className="w-2.5 h-2.5" /> Encrypt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 rounded-xs uppercase">
                        <Unlock className="w-2.5 h-2.5" /> Decrypt
                      </span>
                    )}

                    <span className="text-[10px] font-bold text-[#A3B18A] bg-[#141611] px-1.5 py-0.5 border border-[#2A2D24] rounded-xs">
                      k = {act.shift}
                    </span>

                    {act.notes && (
                      <span className="text-[10px] text-neutral-400 hidden sm:inline truncate max-w-[200px]">
                        {act.notes}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-600" /> {formatTimestamp(act.timestamp)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleCopyOutput(act.id, act.outputSnippet)}
                      className="px-1.5 py-0.5 bg-[#141611] hover:bg-[#1A1C16] text-[#A3B18A] hover:text-white border border-[#2A2D24] rounded-xs text-[9px] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Copy output payload"
                    >
                      {isCopied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Input vs Output Preview Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                  <div className="p-2 bg-[#0E100A] border border-[#1A1C14] rounded-xs">
                    <span className="text-[9px] text-neutral-500 uppercase block font-bold mb-0.5">
                      Input ({act.inputLength} chars):
                    </span>
                    <p className="text-neutral-300 truncate">{act.inputSnippet}</p>
                  </div>

                  <div className="p-2 bg-[#12150D] border border-[#22271A] rounded-xs">
                    <span className="text-[9px] text-[#A3B18A] uppercase block font-bold mb-0.5">
                      Output ({act.outputLength} chars):
                    </span>
                    <p className="text-[#E0E5D8] truncate font-semibold">{act.outputSnippet}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Navigation Jump */}
      <div className="pt-2 border-t border-[#1F221A] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-neutral-500">
        <span>Session logs stored locally in client application state.</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('encrypt')}
            className="text-[#A3B18A] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Encrypt Studio</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
          <span className="text-neutral-700">|</span>
          <button
            type="button"
            onClick={() => onNavigate('decrypt')}
            className="text-[#A3B18A] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Decrypt Studio</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
