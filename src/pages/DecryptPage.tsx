import React, { useState, useEffect } from 'react';
import {
  Unlock,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { decrypt, isValidShift, normalizeShift } from '../services/caesarCipher';
import { logOperation } from '../services/activityStore';
import { copyToClipboard } from '../utils/clipboard';
import { ShiftSelector } from '../components/common/ShiftSelector';
import { AppView } from '../types/navigation';

interface DecryptPageProps {
  onNavigate: (view: AppView) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const DecryptPage: React.FC<DecryptPageProps> = ({ onNavigate, onToast }) => {
  const [ciphertext, setCiphertext] = useState('');
  const [shift, setShift] = useState(3);
  const [plaintext, setPlaintext] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check for pre-filled data from encrypt or history navigation
  useEffect(() => {
    try {
      const prefill = sessionStorage.getItem('secure_comm_decrypt_prefill');
      const shiftPrefill = sessionStorage.getItem('secure_comm_decrypt_shift');
      if (prefill) {
        setCiphertext(prefill);
        sessionStorage.removeItem('secure_comm_decrypt_prefill');
      }
      if (shiftPrefill) {
        const parsed = parseInt(shiftPrefill, 10);
        if (!isNaN(parsed)) setShift(parsed);
        sessionStorage.removeItem('secure_comm_decrypt_shift');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDecrypt = () => {
    setErrorMessage(null);

    const trimmed = ciphertext.trim();
    if (!trimmed) {
      setErrorMessage('Please enter an encrypted message to decrypt.');
      return;
    }

    if (shift < 0 || shift > 25) {
      setErrorMessage('Choose a shift between 0 and 25.');
      return;
    }

    const result = decrypt(ciphertext, shift);
    setPlaintext(result);
    setCopied(false);

    // Log to local activity history
    logOperation('DECRYPT', shift, ciphertext, result, `Decrypted with shift ${shift}`);

    onToast?.('success', 'Message decrypted.', `Reversed shift ${shift}.`);
  };

  const handleCopy = async () => {
    if (!plaintext) return;
    const success = await copyToClipboard(plaintext);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onToast?.('success', 'Copied', 'Decrypted message copied to clipboard.');
    }
  };

  const handleClear = () => {
    setCiphertext('');
    setPlaintext('');
    setErrorMessage(null);
    setCopied(false);
  };

  const handleTryBruteForce = () => {
    sessionStorage.setItem('secure_comm_bruteforce_prefill', ciphertext);
    onNavigate('learn');
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Decrypt Message
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Paste the encrypted text and enter the shift to reveal the original message.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6 transition-colors">
        {/* Ciphertext Input Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="decrypt-ciphertext-input"
              className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
            >
              Encrypted text
            </label>
            {ciphertext.length > 0 && (
              <span className="text-xs text-neutral-400">
                {ciphertext.length} character{ciphertext.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <textarea
            id="decrypt-ciphertext-input"
            rows={5}
            value={ciphertext}
            onChange={(e) => {
              setCiphertext(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Paste encrypted message..."
            className="w-full p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y text-base transition-all font-mono"
          />

          {errorMessage && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Shift Selector Component */}
        <ShiftSelector value={shift} onChange={setShift} />

        {/* Primary Action Button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            id="btn-decrypt-action"
            onClick={handleDecrypt}
            className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
            <span>Decrypt</span>
          </button>

          {ciphertext.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="h-12 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-sm font-medium"
              title="Clear form"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Result Area */}
        {plaintext ? (
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <span>Decrypted message</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-medium">
                  Shift {shift}
                </span>
              </label>

              <button
                type="button"
                id="btn-copy-plaintext"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Output Box */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 font-sans text-sm sm:text-base text-neutral-900 dark:text-neutral-100 break-words whitespace-pre-wrap select-all">
              {plaintext}
            </div>
          </div>
        ) : (
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-neutral-400 dark:text-neutral-500">
            <span>Enter text and click Decrypt to reveal the message.</span>
            {ciphertext.length > 0 && (
              <button
                type="button"
                onClick={handleTryBruteForce}
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>Don't know the shift? Try Brute Force</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
