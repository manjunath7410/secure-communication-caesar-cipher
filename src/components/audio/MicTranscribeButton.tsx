/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mic, Radio } from 'lucide-react';
import { AudioTranscribeModal } from './AudioTranscribeModal';

interface MicTranscribeButtonProps {
  onTranscribed: (text: string) => void;
  targetLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'subtle' | 'solid';
  className?: string;
}

export const MicTranscribeButton: React.FC<MicTranscribeButtonProps> = ({
  onTranscribed,
  targetLabel = 'Message Field',
  size = 'md',
  variant = 'subtle',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-xs gap-2',
    lg: 'px-4 py-2.5 text-sm gap-2.5',
  };

  const variantClasses = {
    subtle:
      'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700',
    solid:
      'bg-blue-600 hover:bg-blue-700 text-white shadow-xs',
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-center font-medium rounded-xl transition-all active:scale-95 cursor-pointer ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        title="Dictate with microphone (gemini-3.5-transcribe)"
      >
        <Mic className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>Voice Dictate</span>
      </button>

      <AudioTranscribeModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onInsertText={onTranscribed}
        targetFieldLabel={targetLabel}
      />
    </>
  );
};
