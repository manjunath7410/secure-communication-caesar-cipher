import React from 'react';
import { encrypt } from '../../services/caesarCipher';

interface AlphabetShiftStripProps {
  shift: number;
  className?: string;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const AlphabetShiftStrip: React.FC<AlphabetShiftStripProps> = ({
  shift,
  className = '',
}) => {
  return (
    <div
      id="dashboard-alphabet-strip"
      className={`p-4 bg-[#0D0E0A] border border-[#2A2D24] rounded-xs space-y-2 font-mono ${className}`}
    >
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span className="font-bold uppercase tracking-wider text-neutral-300">
          Live Alphabet Mapping
        </span>
        <span className="text-[10px] text-[#A3B18A]">
          P(x) → C((x + {shift}) mod 26)
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1 min-w-[560px] sm:min-w-full justify-between">
          {ALPHABET.map((char) => {
            const cipherChar = encrypt(char, shift);
            const isModified = char !== cipherChar;
            return (
              <div
                key={char}
                className={`flex-1 flex flex-col items-center px-0.5 py-1 border rounded-xs ${
                  isModified
                    ? 'border-[#2A2D24] bg-[#070805]'
                    : 'border-[#1F221A] bg-[#0E100A]'
                }`}
              >
                <span className="text-[10px] text-neutral-400 font-medium">{char}</span>
                <span className="text-[7px] text-neutral-600">↓</span>
                <span className="text-[10px] font-bold text-[#A3B18A]">{cipherChar}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
