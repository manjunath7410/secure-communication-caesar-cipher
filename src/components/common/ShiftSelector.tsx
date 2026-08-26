import React from 'react';
import { Minus, Plus, HelpCircle } from 'lucide-react';

interface ShiftSelectorProps {
  value: number;
  onChange: (newValue: number) => void;
  className?: string;
  showPresets?: boolean;
}

export const ShiftSelector: React.FC<ShiftSelectorProps> = ({
  value,
  onChange,
  className = '',
  showPresets = true,
}) => {
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
      // Normalize to 0-25
      const normalized = ((num % 26) + 26) % 26;
      onChange(normalized);
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
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
              className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors cursor-pointer ${
                value === 3
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              Caesar (3)
            </button>
            <button
              type="button"
              onClick={() => onChange(13)}
              className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors cursor-pointer ${
                value === 13
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              ROT13 (13)
            </button>
          </div>
        )}
      </div>

      {/* Stepper control */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-1 shadow-xs">
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
            className="w-14 text-center text-lg font-semibold bg-transparent text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
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

        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-tight">
          Shift determines how many positions each letter moves in the alphabet.
        </p>
      </div>
    </div>
  );
};
