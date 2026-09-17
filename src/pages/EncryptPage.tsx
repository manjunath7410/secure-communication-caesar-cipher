import React, { useState } from 'react';
import {
  Lock,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { encrypt, isValidShift, normalizeShift } from '../services/caesarCipher';
import { logOperation } from '../services/activityStore';
import { messageService } from '../services/messageService';
import { authService } from '../services/authService';
import { copyToClipboard } from '../utils/clipboard';
import { ShiftSelector } from '../components/common/ShiftSelector';
import { MicTranscribeButton } from '../components/audio/MicTranscribeButton';
import { useShift } from '../context/ShiftContext';
import { AppView } from '../types/navigation';

interface EncryptPageProps {
  onNavigate: (view: AppView) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const EncryptPage: React.FC<EncryptPageProps> = ({ onNavigate, onToast }) => {
  const [message, setMessage] = useState('');
  const { shift, setShift } = useShift();
  const [ciphertext, setCiphertext] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVaultSaved, setIsVaultSaved] = useState(false);

  const handleEncrypt = () => {
    setErrorMessage(null);

    const trimmed = message.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a message.');
      return;
    }

    if (shift < 0 || shift > 25) {
      setErrorMessage('Choose a shift between 0 and 25.');
      return;
    }

    const result = encrypt(message, shift);
    setCiphertext(result);
    setCopied(false);
    setIsVaultSaved(false);

    // Log to local activity history
    logOperation('ENCRYPT', shift, message, result, `Encrypted with shift ${shift}`);

    // If operator is authenticated, persist encrypted payload in vault
    const user = authService.getCurrentUser();
    if (user) {
      messageService.createMessage({
        ciphertext: result,
        shift,
        operationType: 'ENCRYPT',
        notes: `Encrypted with shift ${shift}`,
      })
        .then(() => setIsVaultSaved(true))
        .catch(() => {});
    }

    onToast?.('success', 'Message encrypted.', `Shift ${shift} applied.`);
  };

  const handleCopy = async () => {
    if (!ciphertext) return;
    const success = await copyToClipboard(ciphertext);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onToast?.('success', 'Copied', 'Encrypted message copied to clipboard.');
    }
  };

  const handleClear = () => {
    setMessage('');
    setCiphertext('');
    setErrorMessage(null);
    setCopied(false);
  };

  const handleOpenInDecrypt = () => {
    sessionStorage.setItem('secure_comm_decrypt_prefill', ciphertext);
    onNavigate('decrypt');
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
          Encrypt Message
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Write your message and choose a shift to encode it.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6 transition-colors">
        {/* Message Input Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="encrypt-message-input"
              className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
            >
              Your message
            </label>
            <div className="flex items-center gap-2">
              <MicTranscribeButton
                size="sm"
                targetLabel="Plaintext Message"
                onTranscribed={(spokenText) => {
                  setMessage((prev) => (prev ? `${prev} ${spokenText}` : spokenText));
                  if (errorMessage) setErrorMessage(null);
                }}
              />
              {message.length > 0 && (
                <span className="text-xs text-neutral-400">
                  {message.length} character{message.length === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>

          <textarea
            id="encrypt-message-input"
            rows={5}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Type or paste your message..."
            className="w-full p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y text-base transition-all font-sans"
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
            id="btn-encrypt-action"
            onClick={handleEncrypt}
            className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Encrypt</span>
          </button>

          {message.length > 0 && (
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
        {ciphertext ? (
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                <span>Encrypted message</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono font-medium">
                  Shift {shift}
                </span>
              </label>

              <button
                type="button"
                id="btn-copy-ciphertext"
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
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 font-mono text-sm sm:text-base text-neutral-900 dark:text-neutral-100 break-words whitespace-pre-wrap select-all">
              {ciphertext}
            </div>

            {/* Secondary actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isVaultSaved ? 'Saved to your encrypted history.' : 'Ready to share or decrypt.'}
              </p>

              <button
                type="button"
                onClick={handleOpenInDecrypt}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Test in Decrypt</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-2 text-center text-xs text-neutral-400 dark:text-neutral-500">
            Enter your text and click Encrypt to view the result.
          </div>
        )}
      </div>
    </div>
  );
};
