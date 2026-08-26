import React, { useState } from 'react';
import { Lock, Copy, Check, ArrowRight, RotateCcw, Zap } from 'lucide-react';
import { encrypt } from '../../services/caesarCipher';
import { copyToClipboard } from '../../utils/clipboard';
import { AppView } from '../../types/navigation';

interface QuickEncryptCardProps {
  currentShift: number;
  onLogOperation: (type: 'ENCRYPT', shift: number, input: string, output: string, notes?: string) => void;
  onNavigate: (view: AppView) => void;
  onToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
  className?: string;
}

export const QuickEncryptCard: React.FC<QuickEncryptCardProps> = ({
  currentShift,
  onLogOperation,
  onNavigate,
  onToast,
  className = '',
}) => {
  const [input, setInput] = useState('OPERATION ODIN: LAUNCH AIR SUPPORT AT 0530Z');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [lastShift, setLastShift] = useState<number | null>(null);

  const handleQuickEncrypt = () => {
    if (!input.trim()) {
      onToast('warning', 'Empty Input', 'Enter a plaintext message to execute Quick Encrypt.');
      setOutput('');
      return;
    }

    const encrypted = encrypt(input, currentShift);
    setOutput(encrypted);
    setLastShift(currentShift);

    // Log to local application state
    onLogOperation('ENCRYPT', currentShift, input, encrypted, `Quick Encrypt (k=${currentShift})`);
    onToast('success', 'Quick Encrypt Executed', `Ciphertext generated using k=${currentShift}.`);
  };

  const handleCopy = async () => {
    if (!output) return;
    const success = await copyToClipboard(output);
    if (success) {
      setCopied(true);
      onToast('success', 'Ciphertext Copied', 'Copied output to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } else {
      onToast('error', 'Copy Failed', 'Unable to access clipboard.');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setLastShift(null);
  };

  return (
    <div
      id="quick-encrypt-action-card"
      className={`p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-4 flex flex-col justify-between shadow-xs transition-colors ${className}`}
    >
      <div className="space-y-3">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              Quick Encrypt Action
            </h3>
          </div>
          <span className="text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-400">
            Shift: <span className="text-blue-600 dark:text-blue-400 font-bold">k = {currentShift}</span>
          </span>
        </div>

        {/* Input Textarea */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>Plaintext Payload</span>
            <span>{input.length} chars</span>
          </div>
          <textarea
            id="quick-encrypt-input"
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type plaintext to quickly encrypt..."
            className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:border-blue-500 focus:outline-none text-xs text-neutral-900 dark:text-neutral-100 rounded-xl resize-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-mono"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="quick-encrypt-btn"
            type="button"
            onClick={handleQuickEncrypt}
            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Zap className="w-3.5 h-3.5" /> Execute Quick Encrypt
          </button>

          <button
            id="quick-encrypt-clear-btn"
            type="button"
            onClick={handleClear}
            className="p-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-xl transition-colors cursor-pointer"
            title="Clear fields"
            aria-label="Clear Quick Encrypt fields"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Output Viewport */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span>Transformed Ciphertext</span>
            {output && (
              <button
                id="quick-encrypt-copy-btn"
                type="button"
                onClick={handleCopy}
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          <div
            id="quick-encrypt-output-box"
            className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-blue-600 dark:text-blue-400 font-mono font-bold rounded-xl min-h-[58px] break-words select-all leading-relaxed"
          >
            {output || (
              <span className="text-neutral-400 dark:text-neutral-600 font-normal italic font-sans">
                Click &quot;Execute Quick Encrypt&quot; to generate ciphertext output...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Deep Link to Full Studio */}
      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
        <button
          type="button"
          id="dashboard-goto-encrypt-studio-btn"
          onClick={() => onNavigate('encrypt')}
          className="w-full py-2 px-2.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
        >
          <span>Open Full Encrypt Studio</span>
          <ArrowRight className="w-3 h-3 text-blue-600 dark:text-blue-400" />
        </button>
      </div>
    </div>
  );
};
