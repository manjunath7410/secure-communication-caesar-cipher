import React, { useState } from 'react';
import { Unlock, Copy, Check, ArrowRight, RotateCcw, Zap } from 'lucide-react';
import { decrypt } from '../../services/caesarCipher';
import { copyToClipboard } from '../../utils/clipboard';
import { AppView } from '../../types/navigation';

interface QuickDecryptCardProps {
  currentShift: number;
  onLogOperation: (type: 'DECRYPT', shift: number, input: string, output: string, notes?: string) => void;
  onNavigate: (view: AppView) => void;
  onToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
  className?: string;
}

export const QuickDecryptCard: React.FC<QuickDecryptCardProps> = ({
  currentShift,
  onLogOperation,
  onNavigate,
  onToast,
  className = '',
}) => {
  const [input, setInput] = useState('RSHUDWLRQ RGLQ: ODXQFK DLU VXSSRUW DW 0530C');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [lastShift, setLastShift] = useState<number | null>(null);

  const handleQuickDecrypt = () => {
    if (!input.trim()) {
      onToast('warning', 'Empty Input', 'Enter a ciphertext message to execute Quick Decrypt.');
      setOutput('');
      return;
    }

    const decrypted = decrypt(input, currentShift);
    setOutput(decrypted);
    setLastShift(currentShift);

    // Log to local application state
    onLogOperation('DECRYPT', currentShift, input, decrypted, `Quick Decrypt (k=${currentShift})`);
    onToast('success', 'Quick Decrypt Executed', `Plaintext recovered using inverse k=${currentShift}.`);
  };

  const handleCopy = async () => {
    if (!output) return;
    const success = await copyToClipboard(output);
    if (success) {
      setCopied(true);
      onToast('success', 'Plaintext Copied', 'Copied output to clipboard.');
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
      id="quick-decrypt-action-card"
      className={`p-5 bg-[#0D0E0A] border border-[#2A2D24] rounded-xs space-y-4 font-mono flex flex-col justify-between ${className}`}
    >
      <div className="space-y-3">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-[#1F221A] pb-3">
          <div className="flex items-center gap-2">
            <Unlock className="w-4 h-4 text-[#A3B18A]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A3B18A]">
              Quick Decrypt Action
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-[#141611] border border-[#2A2D24] text-neutral-400">
            Shift: <span className="text-[#A3B18A] font-bold">k = {currentShift}</span>
          </span>
        </div>

        {/* Input Textarea */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-neutral-400 uppercase">
            <span>Ciphertext Payload</span>
            <span>{input.length} chars</span>
          </div>
          <textarea
            id="quick-decrypt-input"
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste ciphertext to invert..."
            className="w-full p-2.5 bg-[#070805] border border-[#2A2D24] focus:border-[#A3B18A] focus:outline-none text-xs text-[#E0E5D8] rounded-xs resize-none placeholder:text-neutral-600"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="quick-decrypt-btn"
            type="button"
            onClick={handleQuickDecrypt}
            className="flex-1 py-2 px-3 bg-[#A3B18A] hover:bg-[#b4c39b] active:bg-[#92a179] text-[#0A0B08] font-bold text-xs uppercase tracking-wider rounded-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Zap className="w-3.5 h-3.5" /> Execute Quick Decrypt
          </button>

          <button
            id="quick-decrypt-clear-btn"
            type="button"
            onClick={handleClear}
            className="p-2 bg-[#141611] hover:bg-[#1A1C16] border border-[#2A2D24] text-neutral-400 hover:text-white rounded-xs transition-colors cursor-pointer"
            title="Clear fields"
            aria-label="Clear Quick Decrypt fields"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Output Viewport */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[10px] text-neutral-400 uppercase">
            <span>Recovered Plaintext</span>
            {output && (
              <button
                id="quick-decrypt-copy-btn"
                type="button"
                onClick={handleCopy}
                className="text-[#A3B18A] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          <div
            id="quick-decrypt-output-box"
            className="w-full p-2.5 bg-[#070805] border border-[#2A2D24] text-xs text-[#A3B18A] font-bold rounded-xs min-h-[58px] break-words select-all leading-relaxed"
          >
            {output || (
              <span className="text-neutral-600 font-normal italic">
                Click &quot;Execute Quick Decrypt&quot; to recover plaintext output...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Deep Link to Full Studio */}
      <div className="pt-3 border-t border-[#1F221A]">
        <button
          type="button"
          id="dashboard-goto-decrypt-studio-btn"
          onClick={() => onNavigate('decrypt')}
          className="w-full py-2 px-2.5 text-[11px] text-neutral-400 hover:text-white hover:bg-[#141611] border border-transparent hover:border-[#2A2D24] rounded-xs transition-colors flex items-center justify-between cursor-pointer"
        >
          <span>Open Full Decrypt Studio</span>
          <ArrowRight className="w-3 h-3 text-[#A3B18A]" />
        </button>
      </div>
    </div>
  );
};
