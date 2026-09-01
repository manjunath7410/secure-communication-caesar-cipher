import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ArrowDown,
  ShieldAlert,
  Flame,
  Copy,
  Check,
} from 'lucide-react';
import { executeBruteForceAttack } from '../services/bruteForceService';
import { BruteForceAnalysis } from '../types/bruteForce';
import { copyToClipboard } from '../utils/clipboard';
import { useShift } from '../context/ShiftContext';
import { AppView } from '../types/navigation';

interface LearnPageProps {
  onNavigate: (view: AppView) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const LearnPage: React.FC<LearnPageProps> = ({ onNavigate, onToast }) => {
  const { shift: activeShift, setShift } = useShift();
  const [sampleText, setSampleText] = useState('DWWDFN DW GDZQ');
  const [bruteResult, setBruteResult] = useState<BruteForceAnalysis | null>(null);
  const [copiedShift, setCopiedShift] = useState<number | null>(null);

  // Check if we came from decrypt page with prefill
  useEffect(() => {
    try {
      const prefill = sessionStorage.getItem('secure_comm_bruteforce_prefill');
      if (prefill && prefill.trim()) {
        setSampleText(prefill.trim());
        sessionStorage.removeItem('secure_comm_bruteforce_prefill');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleRunBruteForce = () => {
    if (!sampleText.trim()) return;
    const result = executeBruteForceAttack(sampleText);
    setBruteResult(result);
  };

  useEffect(() => {
    handleRunBruteForce();
  }, [sampleText]);

  const handleCopyCandidate = async (shift: number, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedShift(shift);
      setTimeout(() => setCopiedShift(null), 2000);
      onToast?.('success', 'Copied', `Shift ${shift} candidate copied.`);
    }
  };

  const samplePresets = [
    { label: 'Sample 1', text: 'DWWDFN DW GDZQ' },
    { label: 'Sample 2', text: 'KHOOR ZRUOG' },
    { label: 'ROT13 Sample', text: 'Uryyb Jbeyq!' },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Learn How Caesar Cipher Works
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          An easy-to-understand visual guide to classical shift encryption and why it is not secure.
        </p>
      </div>

      {/* 1. What is Caesar Cipher */}
      <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
            1
          </span>
          <span>What is the Caesar Cipher?</span>
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
          The Caesar Cipher is one of the simplest and oldest known encryption techniques. Used by Julius Caesar over 2,000 years ago for private correspondence, it works by shifting every letter in the text by a fixed number of positions along the alphabet.
        </p>
      </section>

      {/* 2. How Encryption Works */}
      <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
            2
          </span>
          <span>How Encryption Works</span>
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
          To encrypt a word, choose a shift number (such as <strong>+3</strong>). Each letter moves forward in the alphabet by 3 letters. If you reach the end of the alphabet (Z), it wraps around to the beginning (A).
        </p>

        {/* Visual Diagram */}
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center space-y-2 py-6">
          <div className="font-mono text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-widest">
            H &nbsp; E &nbsp; L &nbsp; L &nbsp; O
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
            <ArrowDown className="w-4 h-4" />
            <span>Shift each letter forward (+3)</span>
            <ArrowDown className="w-4 h-4" />
          </div>
          <div className="font-mono text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 tracking-widest">
            K &nbsp; H &nbsp; O &nbsp; O &nbsp; R
          </div>
        </div>

        {/* Letter mapping mini-strip */}
        <div className="space-y-1.5 pt-2">
          <span className="text-xs text-neutral-500 font-medium">Alphabet mapping (Shift +3):</span>
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 overflow-x-auto text-xs font-mono text-neutral-700 dark:text-neutral-300 flex items-center gap-3">
            <span>A→D</span>
            <span>B→E</span>
            <span>C→F</span>
            <span>D→G</span>
            <span>E→H</span>
            <span>...</span>
            <span>X→A</span>
            <span>Y→B</span>
            <span>Z→C</span>
          </div>
        </div>
      </section>

      {/* 3. How Decryption Works */}
      <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
            3
          </span>
          <span>How Decryption Works</span>
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
          Decryption is simply the reverse of encryption. By shifting backwards by the same key (or shifting forward by <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-xs">26 - shift</code>), you recover the original text.
        </p>

        {/* Visual Diagram */}
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center space-y-2 py-6">
          <div className="font-mono text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 tracking-widest">
            K &nbsp; H &nbsp; O &nbsp; O &nbsp; R
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <ArrowDown className="w-4 h-4" />
            <span>Reverse the shift (-3)</span>
            <ArrowDown className="w-4 h-4" />
          </div>
          <div className="font-mono text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-widest">
            H &nbsp; E &nbsp; L &nbsp; L &nbsp; O
          </div>
        </div>
      </section>

      {/* 4. Why Caesar Cipher is Not Secure */}
      <section className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6 shadow-xs space-y-3">
        <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span>Why Caesar Cipher is Not Secure</span>
        </h2>
        <p className="text-sm text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
          In cryptography, the strength of an encryption algorithm depends on the size of its key space (the number of possible secret keys).
        </p>
        <ul className="text-sm text-amber-900/90 dark:text-amber-200/90 space-y-2 list-disc list-inside">
          <li>
            <strong>Tiny Key Space:</strong> The English alphabet only has 26 letters, so there are only <strong>25 possible secret shifts</strong> (shift 0 is no change).
          </li>
          <li>
            <strong>Instant Brute Force:</strong> A human or computer can test all 25 possible shifts in milliseconds to find the readable message.
          </li>
          <li>
            <strong>Letter Frequency:</strong> The letter 'E' is the most common letter in English. Even without testing every key, looking at the most frequent letter in the ciphertext reveals the shift immediately.
          </li>
        </ul>
      </section>

      {/* 5. Interactive Brute-Force Demonstration */}
      <section className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              See why Caesar Cipher is breakable
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Caesar Cipher has only 26 possible shifts, so trying every key is easy.
          </p>
        </div>

        {/* Input box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Enter encrypted text
            </label>
            <div className="flex items-center gap-1.5">
              {samplePresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setSampleText(preset.text)}
                  className="px-2 py-0.5 rounded text-[11px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
              placeholder="Enter encrypted text to break..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-sm font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={handleRunBruteForce}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs cursor-pointer shrink-0"
            >
              Try all 26 shifts
            </button>
          </div>
        </div>

        {/* 26 Shifts Result List */}
        {bruteResult && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>All 26 possible translations (k = 0 to 25):</span>
              <span className="font-mono text-[11px]">
                Analyzed in {bruteResult.executionTimeMs.toFixed(1)}ms
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2 bg-neutral-50 dark:bg-neutral-950">
              {bruteResult.candidates.map((c) => {
                const isTopMatch = bruteResult.topCandidate?.shift === c.shift && c.wordMatches.length > 0;
                const isCopied = copiedShift === c.shift;

                return (
                  <div
                    key={c.shift}
                    className={`p-2.5 rounded-lg flex items-center justify-between gap-3 text-xs transition-colors ${
                      isTopMatch
                        ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800'
                        : 'bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-12 shrink-0 font-mono text-[11px] font-medium text-neutral-500">
                        Shift {c.shift}
                      </span>
                      <span className="font-mono text-neutral-900 dark:text-neutral-100 truncate">
                        {c.candidatePlaintext}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isTopMatch && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                          Likely match
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShift(c.shift);
                          onToast?.('success', 'Shift Updated', `Active Caesar shift set to ${c.shift}`);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          activeShift === c.shift
                            ? 'bg-blue-600 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                        title="Set as active global shift"
                      >
                        {activeShift === c.shift ? 'Active' : 'Apply'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyCandidate(c.shift, c.candidatePlaintext)}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                        title="Copy candidate"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
