import React, { useState } from 'react';
import { Minus, Plus, Sliders, ChevronDown, ChevronUp } from 'lucide-react';

interface ShiftSelectorProps {
  value: number;
  onChange: (newValue: number) => void;
  className?: string;
  showPresets?: boolean;
  showSlider?: boolean;
  showAlphabetPreview?: boolean;
}

export const ShiftSelector: React.FC<ShiftSelectorProps> = ({
  value,
  onChange,
  className = '',
  showPresets = true,
  showSlider = true,
  showAlphabetPreview = true,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const handleDecrement = () => {
    const next = value <= 0 ? 25 : value - 1;
    onChange(next);
  };

  const handleIncrement = () => {
    const next = value >= 25 ? 0 : value + 1;
    onChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(0);
      return;
    }
    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      const normalized = ((num % 26) + 26) % 26;
      onChange(normalized);
    }
  };

  const sampleLetters = ['A', 'B', 'C', 'D', 'E', 'M', 'X', 'Y', 'Z'];

  const getShiftedChar = (char: string, shiftVal: number) => {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      return String.fromCharCode(((code - 65 + shiftVal) % 26) + 65);
    }
    return char;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label and Presets */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-sm font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
          <span>Shift key</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal">
            (0–25)
          </span>
        </label>

        {showPresets && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onChange(3)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                value === 3
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              Caesar (+3)
            </button>
            <button
              type="button"
              onClick={() => onChange(13)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                value === 13
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              ROT13 (+13)
            </button>
            <button
              type="button"
              onClick={() => onChange(0)}
              className={`px-2 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                value === 0
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              0
            </button>
          </div>
        )}
      </div>

      {/* Stepper Control and Range Slider */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {/* Number Stepper */}
          <div className="inline-flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={handleDecrement}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer"
              aria-label="Decrease shift"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              type="number"
              min="0"
              max="25"
              value={value}
              onChange={handleInputChange}
              className="w-14 text-center text-lg font-bold bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded font-mono"
              aria-label="Shift amount"
            />

            <button
              type="button"
              onClick={handleIncrement}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer"
              aria-label="Increase shift"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Range Slider for rapid adjustment */}
          {showSlider && (
            <div className="flex-1 flex items-center gap-2 px-1">
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                aria-label="Shift slider"
              />
            </div>
          )}
        </div>

        {/* Optional Alphabet Shift Visualizer */}
        {showAlphabetPreview && (
          <div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Alphabet preview (A→{getShiftedChar('A', value)})</span>
              {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showPreview && (
              <div className="mt-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800/80 overflow-x-auto text-xs font-mono text-neutral-700 dark:text-neutral-300 flex items-center gap-3">
                {sampleLetters.map((letter) => (
                  <div key={letter} className="flex flex-col items-center shrink-0">
                    <span className="text-neutral-400 font-sans text-[10px]">orig</span>
                    <span className="font-bold">{letter}</span>
                    <span className="text-blue-500 text-[10px]">↓</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {getShiftedChar(letter, value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
