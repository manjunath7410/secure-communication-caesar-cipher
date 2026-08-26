import React from 'react';
import { KeyRound, RotateCcw, Sliders } from 'lucide-react';

interface CurrentShiftDisplayProps {
  selectedShift: number;
  onShiftChange: (newShift: number) => void;
  className?: string;
}

const COMMON_PRESETS = [
  { value: 0, label: 'k=0 (Identity)' },
  { value: 1, label: 'k=1' },
  { value: 3, label: 'k=3 (Caesar)' },
  { value: 5, label: 'k=5' },
  { value: 7, label: 'k=7' },
  { value: 13, label: 'k=13 (ROT13)' },
  { value: 19, label: 'k=19' },
  { value: 25, label: 'k=25 (Inverse k=1)' },
];

export const CurrentShiftDisplay: React.FC<CurrentShiftDisplayProps> = ({
  selectedShift,
  onShiftChange,
  className = '',
}) => {
  return (
    <div
      id="current-shift-display-panel"
      className={`p-5 bg-[#0D0E0A] border border-[#2A2D24] rounded-xs space-y-4 font-mono ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F221A] pb-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#A3B18A]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#A3B18A]">
            Current Selected Shift
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-400">Ring Modulo:</span>
          <span className="text-xs font-bold text-[#E0E5D8] px-2 py-0.5 bg-[#141611] border border-[#2A2D24] rounded-xs">
            k = {selectedShift} &nbsp;(Z₂₆)
          </span>
        </div>
      </div>

      {/* Main Shift Value & Slider */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        <div className="sm:col-span-4 p-3 bg-[#070805] border border-[#2A2D24] rounded-xs text-center space-y-1">
          <span className="text-[10px] text-neutral-500 uppercase font-bold block">Active Offset</span>
          <div className="text-3xl font-bold text-[#A3B18A] tracking-tight">
            +{selectedShift}
          </div>
          <span className="text-[9px] text-neutral-400 block">
            {selectedShift === 3
              ? 'Classical Caesar Shift'
              : selectedShift === 13
              ? 'Symmetric ROT13 Inversion'
              : selectedShift === 0
              ? 'Identity (No Shift)'
              : `Offset by ${selectedShift} letters`}
          </span>
        </div>

        <div className="sm:col-span-8 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <Sliders className="w-3.5 h-3.5 text-[#A3B18A]" />
              <span>Adjust Active Shift Dial [0 – 25]</span>
            </span>
            <span className="text-[10px] font-mono text-[#A3B18A]">
              E(x) = (x + {selectedShift}) mod 26
            </span>
          </div>

          <div className="space-y-1">
            <input
              id="dashboard-shift-slider"
              type="range"
              min="0"
              max="25"
              value={selectedShift}
              onChange={(e) => onShiftChange(parseInt(e.target.value, 10) || 0)}
              className="w-full h-2 bg-[#141611] rounded-xs appearance-none cursor-pointer accent-[#A3B18A] border border-[#2A2D24]"
              aria-label="Current selected shift slider"
            />
            <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
              <span>0 (A→A)</span>
              <span>3 (Caesar)</span>
              <span>13 (ROT13)</span>
              <span>25 (A→Z)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Shift Presets Bar */}
      <div className="pt-2 border-t border-[#1F221A] flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] text-neutral-500 uppercase font-bold mr-1">
          Tactical Presets:
        </span>
        {COMMON_PRESETS.map((preset) => {
          const isActive = selectedShift === preset.value;
          return (
            <button
              key={preset.value}
              id={`shift-preset-btn-${preset.value}`}
              type="button"
              onClick={() => onShiftChange(preset.value)}
              className={`px-2 py-1 text-[10px] rounded-xs border transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#1A1C16] border-[#A3B18A] text-[#A3B18A] font-bold shadow-xs'
                  : 'bg-[#141611] border-[#1F221A] text-neutral-400 hover:border-[#2A2D24] hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
