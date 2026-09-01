import React, { useState, useEffect } from 'react';
import {
  Unlock,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Flame,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import { decrypt, isValidShift, normalizeShift } from '../services/caesarCipher';
import { logOperation } from '../services/activityStore';
import { copyToClipboard } from '../utils/clipboard';
import { executeBruteForceAttack } from '../services/bruteForceService';
import { BruteForceAnalysis } from '../types/bruteForce';
import { ShiftSelector } from '../components/common/ShiftSelector';
import { useShift } from '../context/ShiftContext';
import { AppView } from '../types/navigation';

interface DecryptPageProps {
  onNavigate: (view: AppView) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const DecryptPage: React.FC<DecryptPageProps> = ({ onNavigate, onToast }) => {
  const [ciphertext, setCiphertext] = useState('');
  const { shift, setShift } = useShift();
  const [plaintext, setPlaintext] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Brute force inline analysis state
  const [showBruteAnalysis, setShowBruteAnalysis] = useState(false);
  const [bruteResult, setBruteResult] = useState<BruteForceAnalysis | null>(null);
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [copiedShift, setCopiedShift] = useState<number | null>(null);

  // Check for pre-filled data from encrypt or history navigation
  useEffect(() => {
    try {
      const prefill = sessionStorage.getItem('secure_comm_decrypt_prefill');
      if (prefill) {
        setCiphertext(prefill);
        sessionStorage.removeItem('secure_comm_decrypt_prefill');
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
    setBruteResult(null);
    setShowBruteAnalysis(false);
  };

  const handleRunBruteForce = () => {
    if (!ciphertext.trim()) {
      setErrorMessage('Please enter encrypted text first.');
      return;
    }
    const result = executeBruteForceAttack(ciphertext);
    setBruteResult(result);
    setShowBruteAnalysis(true);
  };

  const handleApplyCandidate = (candidateShift: number, candidateText: string) => {
    setShift(candidateShift);
    setPlaintext(candidateText);
    onToast?.('success', 'Shift Applied', `Applied shift ${candidateShift}`);
  };

  const handleCopyCandidate = async (shiftVal: number, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedShift(shiftVal);
      setTimeout(() => setCopiedShift(null), 2000);
      onToast?.('success', 'Copied', `Shift ${shiftVal} translation copied.`);
    }
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
            rows={4}
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

        {/* Primary Action Buttons */}
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
        ) : null}

        {/* Progressive Disclosure: Brute Force Assistant */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span>Don't know the secret shift?</span>
            </div>

            <button
              type="button"
              onClick={handleRunBruteForce}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Analyze with Brute Force</span>
            </button>
          </div>

          {/* Inline Brute Force Result Card */}
          {showBruteAnalysis && bruteResult && (
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Brute-force analysis (tested 25 keys)</span>
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  {bruteResult.executionTimeMs.toFixed(1)}ms
                </span>
              </div>

              {bruteResult.topCandidate ? (
                <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Most Likely Match
                      </span>
                      <span className="text-xs font-mono text-neutral-500">
                        Shift {bruteResult.topCandidate.shift}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleApplyCandidate(
                          bruteResult.topCandidate!.shift,
                          bruteResult.topCandidate!.candidatePlaintext
                        )
                      }
                      className="text-xs px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer shadow-2xs"
                    >
                      Use this shift ({bruteResult.topCandidate.shift})
                    </button>
                  </div>

                  <p className="text-sm font-mono text-neutral-900 dark:text-neutral-100 select-all">
                    {bruteResult.topCandidate.candidatePlaintext}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-neutral-500">
                  No definitive dictionary matches found, but you can inspect all 26 variations below.
                </p>
              )}

              {/* View all 26 shifts toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAllCandidates(!showAllCandidates)}
                  className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 inline-flex items-center gap-1 cursor-pointer font-medium"
                >
                  <span>{showAllCandidates ? 'Hide' : 'View all 26 shift variations'}</span>
                  {showAllCandidates ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showAllCandidates && (
                  <div className="mt-2.5 max-h-56 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {bruteResult.candidates.map((c) => {
                      const isCopied = copiedShift === c.shift;
                      return (
                        <div
                          key={c.shift}
                          className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800/70 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-12 shrink-0 font-mono text-[11px] text-neutral-400">
                              Shift {c.shift}
                            </span>
                            <span className="font-mono text-neutral-900 dark:text-neutral-100 truncate">
                              {c.candidatePlaintext}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleApplyCandidate(c.shift, c.candidatePlaintext)}
                              className="px-2 py-0.5 rounded text-[11px] bg-neutral-100 dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-neutral-700 dark:text-neutral-300 hover:text-blue-600 cursor-pointer"
                            >
                              Apply
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyCandidate(c.shift, c.candidatePlaintext)}
                              className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                              title="Copy candidate"
                            >
                              {isCopied ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
