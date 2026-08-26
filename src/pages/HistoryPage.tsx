import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Copy,
  Check,
  Trash2,
  Eye,
  X,
  Search,
  RotateCcw,
  Clock,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { useOperationsLog } from '../hooks/useOperationsLog';
import { copyToClipboard } from '../utils/clipboard';
import { OperationActivity } from '../services/activityStore';
import { AppView } from '../types/navigation';

interface HistoryPageProps {
  onNavigate: (view: AppView) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate, onToast }) => {
  const { activities, clearLog } = useOperationsLog();
  const [filterType, setFilterType] = useState<'ALL' | 'ENCRYPT' | 'DECRYPT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<OperationActivity | null>(null);

  const handleCopy = async (id: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      onToast?.('success', 'Copied', 'Message copied to clipboard.');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all message history from this device?')) {
      clearLog();
      onToast?.('info', 'History Cleared', 'All activity logs have been removed.');
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (filterType !== 'ALL' && act.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inInput = act.inputSnippet?.toLowerCase().includes(q);
      const inOutput = act.outputSnippet?.toLowerCase().includes(q);
      const inNotes = act.notes?.toLowerCase().includes(q);
      return inInput || inOutput || inNotes;
    }
    return true;
  });

  const formatTime = (timestamp: number): string => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateGroup = (timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) return 'Today';

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group activities by date
  const groupedActivities: { [date: string]: OperationActivity[] } = {};
  filteredActivities.forEach((act) => {
    const groupKey = formatDateGroup(act.timestamp);
    if (!groupedActivities[groupKey]) {
      groupedActivities[groupKey] = [];
    }
    groupedActivities[groupKey].push(act);
  });

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Message History
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            View, copy, and manage your recent cipher operations.
          </p>
        </div>

        {activities.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear history</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 self-start">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterType('ENCRYPT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterType === 'ENCRYPT'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Encrypted
          </button>
          <button
            type="button"
            onClick={() => setFilterType('DECRYPT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterType === 'DECRYPT'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Decrypted
          </button>
        </div>
      </div>

      {/* Main List / Empty State */}
      {filteredActivities.length === 0 ? (
        <div className="p-12 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              No messages yet
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              Your encrypted and decrypted messages will appear here.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('encrypt')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs cursor-pointer"
            >
              Encrypt a message
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActivities).map(([dateGroup, items]) => (
            <div key={dateGroup} className="space-y-2.5">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">
                {dateGroup}
              </h3>

              <div className="space-y-2">
                {items.map((act) => {
                  const isEnc = act.type === 'ENCRYPT';
                  const isCopied = copiedId === act.id;
                  const textToCopy = act.outputSnippet || act.inputSnippet;

                  return (
                    <div
                      key={act.id}
                      className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4 shadow-2xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isEnc
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {isEnc ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                              {isEnc ? 'Encrypted' : 'Decrypted'}
                            </span>
                            <span className="text-[11px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono font-medium">
                              Shift {act.shift}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-neutral-700 dark:text-neutral-300 truncate max-w-md">
                            {act.outputSnippet}
                          </p>
                        </div>
                      </div>

                      {/* Right side metadata & actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-neutral-400 hidden sm:inline">
                          {formatTime(act.timestamp)}
                        </span>

                        <button
                          type="button"
                          onClick={() => setSelectedActivity(act)}
                          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="View details"
                          aria-label="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopy(act.id, textToCopy)}
                          className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Copy message"
                          aria-label="Copy message"
                        >
                          {isCopied ? (
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedActivity && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedActivity(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    selectedActivity.type === 'ENCRYPT'
                      ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {selectedActivity.type === 'ENCRYPT' ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {selectedActivity.type === 'ENCRYPT' ? 'Encrypted Message' : 'Decrypted Message'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input & Output Details */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-neutral-500 font-medium">Input text:</span>
                <div className="mt-1 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 font-mono text-neutral-800 dark:text-neutral-200 break-words">
                  {selectedActivity.inputSnippet}
                </div>
              </div>

              <div>
                <span className="text-neutral-500 font-medium">Result output:</span>
                <div className="mt-1 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 font-mono text-neutral-800 dark:text-neutral-200 break-words">
                  {selectedActivity.outputSnippet}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-neutral-500">
                <div>
                  <span className="font-medium">Shift applied:</span> {selectedActivity.shift}
                </div>
                <div>
                  <span className="font-medium">Characters:</span> {selectedActivity.outputLength}
                </div>
                <div>
                  <span className="font-medium">Time:</span>{' '}
                  {new Date(selectedActivity.timestamp).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  handleCopy(selectedActivity.id, selectedActivity.outputSnippet);
                  setSelectedActivity(null);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Output</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
