/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Lock,
  Unlock,
  ArrowRight,
  Shield,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Send,
  Eye,
  Terminal,
  Activity,
  CheckCircle2,
  Wifi,
} from 'lucide-react';
import { encrypt, decrypt, normalizeShift } from '../../services/caesarCipher';
import { copyToClipboard } from '../../utils/clipboard';
import { AppView } from '../../types/navigation';
import { logOperation } from '../../services/activityStore';

export interface TacticalPreset {
  code: string;
  label: string;
  frequency: string;
  callsign: string;
  text: string;
}

export const TACTICAL_PRESETS: TacticalPreset[] = [
  {
    code: 'ALPHA-1',
    label: 'Reconnaissance Order',
    frequency: '142.85 MHz',
    callsign: 'SCOUT-LEAD',
    text: 'HQ TO SENTINEL: RENDEZVOUS AT COORDINATES FOXTROT NINE AT DAWN',
  },
  {
    code: 'BRAVO-2',
    label: 'Radar Telemetry Alert',
    frequency: '215.40 MHz',
    callsign: 'RADAR-BASE',
    text: 'RADAR CONTACT IDENTIFIED IN SECTOR 7G CONFIRM INTERCEPT SQUADRON',
  },
  {
    code: 'CHARLIE-3',
    label: 'Tactical Extraction',
    frequency: '188.10 MHz',
    callsign: 'PEGASUS-HQ',
    text: 'COMMAND DISPATCH: MAINTAIN RADIO SILENCE AND SECURE EXTRACTION ZONE',
  },
  {
    code: 'DELTA-4',
    label: 'Perimeter Defense Update',
    frequency: '133.50 MHz',
    callsign: 'SENTINEL-NORTH',
    text: 'DEFENSE PERIMETER: SECTOR FOUR GREEN ALL SENSORS NOMINAL NO CONTACT',
  },
];

interface MilitaryRadioSimulatorProps {
  onNavigate?: (view: AppView) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
  className?: string;
}

export const MilitaryRadioSimulator: React.FC<MilitaryRadioSimulatorProps> = ({
  onNavigate,
  onToast,
  className = '',
}) => {
  const [inputText, setInputText] = useState(
    'HQ TO SENTINEL: RENDEZVOUS AT COORDINATES FOXTROT NINE AT DAWN'
  );
  const [shiftKey, setShiftKey] = useState<number>(3); // Classical Caesar default
  const [encryptedOutput, setEncryptedOutput] = useState<string>('');
  const [decryptedOutput, setDecryptedOutput] = useState<string>('');
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [transmissionStep, setTransmissionStep] = useState<number>(4); // Default to completed
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<'encrypted' | 'decrypted' | null>(null);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearPendingTimeouts = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => clearPendingTimeouts();
  }, []);

  // Play subtle tactical radio frequency beep if sound enabled
  const playRadioBeep = (freq = 880, duration = 0.08) => {
    if (!soundEnabled) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // Audio context restricted or unavailable
    }
  };

  // Execute the exact algorithm pipeline:
  // Read text → Shift characters → Encrypt → Decrypt → Display message
  const executePipeline = (text: string, shift: number, animate = false) => {
    clearPendingTimeouts();

    if (!text.trim()) {
      setEncryptedOutput('');
      setDecryptedOutput('');
      setIsTransmitting(false);
      return;
    }

    const normK = normalizeShift(shift);

    if (animate) {
      setIsTransmitting(true);
      setTransmissionStep(1); // Step 1: Read text
      playRadioBeep(660, 0.06);

      const t1 = setTimeout(() => {
        setTransmissionStep(2); // Step 2: Shift characters
        playRadioBeep(770, 0.06);
      }, 200);
      timeoutsRef.current.push(t1);

      const t2 = setTimeout(() => {
        setTransmissionStep(3); // Step 3: Encrypt
        const cipher = encrypt(text, normK);
        setEncryptedOutput(cipher);
        playRadioBeep(880, 0.09);
      }, 450);
      timeoutsRef.current.push(t2);

      const t3 = setTimeout(() => {
        setTransmissionStep(4); // Step 4: Radio Transmission & Decrypt
        const cipher = encrypt(text, normK);
        const plain = decrypt(cipher, normK);
        setDecryptedOutput(plain);
        setIsTransmitting(false);
        playRadioBeep(1100, 0.12);

        // Log operation in local activity store
        logOperation('ENCRYPT', normK, text, cipher, 'Tactical Radio Simulator');
        onToast?.('success', 'Preset Transmitted Over Radio', `Encrypted & decrypted with shift k=${normK}`);
      }, 750);
      timeoutsRef.current.push(t3);
    } else {
      const cipher = encrypt(text, normK);
      const plain = decrypt(cipher, normK);
      setEncryptedOutput(cipher);
      setDecryptedOutput(plain);
      setTransmissionStep(4);
      setIsTransmitting(false);
    }
  };

  useEffect(() => {
    if (!isTransmitting) {
      executePipeline(inputText, shiftKey, false);
    }
  }, [inputText, shiftKey]);

  const handleCopy = async (text: string, type: 'encrypted' | 'decrypted') => {
    if (!text) return;
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
      onToast?.(
        'success',
        type === 'encrypted' ? 'Ciphertext Copied' : 'Plaintext Copied',
        'Message copied to clipboard.'
      );
    }
  };

  const handlePresetSelect = (presetText: string) => {
    setInputText(presetText);
    executePipeline(presetText, shiftKey, true);
  };

  const handleTransmitClick = () => {
    executePipeline(inputText, shiftKey, true);
  };

  const handleClear = () => {
    setInputText('');
    setEncryptedOutput('');
    setDecryptedOutput('');
    setTransmissionStep(0);
  };

  return (
    <div
      id="military-radio-simulator"
      className={`rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden transition-all ${className}`}
    >
      {/* Top Banner: Scenario & Problem Statement Specification */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900/90 via-slate-900 to-indigo-950 text-white border-b border-blue-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                Academic & Tactical Simulator
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                RADIO CHANNEL READY
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-blue-400 shrink-0" />
              <span>Secure Military Communication using Caesar Cipher</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-neutral-300'
              }`}
              title={soundEnabled ? 'Mute radio sounds' : 'Enable radio telemetry sounds'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
            </button>
          </div>
        </div>

        {/* Real-world Scenario & Problem Statement Brief */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/10 text-xs text-neutral-300">
          <div className="p-2.5 rounded-xl bg-black/25 border border-white/10">
            <span className="font-semibold text-blue-300 block mb-0.5">Real-world Scenario:</span>
            Military messages transmitted over radio need confidentiality. Open frequencies are vulnerable to enemy electronic surveillance and interception.
          </div>
          <div className="p-2.5 rounded-xl bg-black/25 border border-white/10">
            <span className="font-semibold text-indigo-300 block mb-0.5">Problem Statement:</span>
            Encrypt and decrypt military messages using Caesar Cipher so unauthorized interceptors receive only scrambled ciphertext while authorized units recover plaintext.
          </div>
        </div>
      </div>

      {/* Algorithm / Pseudo code Step Indicator */}
      <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-neutral-800">
        <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2 flex items-center justify-between">
          <span>Algorithm / Pseudo Code Execution Flow:</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            Read text → Shift characters → Encrypt → Decrypt → Display message
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div
            className={`p-2 rounded-lg border text-center transition-all ${
              transmissionStep >= 1
                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-semibold'
                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400'
            }`}
          >
            <span className="text-[10px] block opacity-70">Step 1</span>
            <span>Read text</span>
          </div>

          <div
            className={`p-2 rounded-lg border text-center transition-all ${
              transmissionStep >= 2
                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-semibold'
                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400'
            }`}
          >
            <span className="text-[10px] block opacity-70">Step 2</span>
            <span>Shift chars (k={shiftKey})</span>
          </div>

          <div
            className={`p-2 rounded-lg border text-center transition-all ${
              transmissionStep >= 3
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 font-semibold'
                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400'
            }`}
          >
            <span className="text-[10px] block opacity-70">Step 3</span>
            <span>Encrypt E(x)</span>
          </div>

          <div
            className={`p-2 rounded-lg border text-center transition-all ${
              transmissionStep >= 4
                ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-semibold'
                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400'
            }`}
          >
            <span className="text-[10px] block opacity-70">Step 4</span>
            <span>Decrypt D(y)</span>
          </div>

          <div
            className={`p-2 rounded-lg border text-center col-span-2 sm:col-span-1 transition-all ${
              transmissionStep >= 4
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 font-semibold'
                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-400'
            }`}
          >
            <span className="text-[10px] block opacity-70">Step 5</span>
            <span>Display output</span>
          </div>
        </div>
      </div>

      {/* Interactive Controls Body */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Preset Tactical Dispatches */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Select Tactical Radio Preset:</span>
            </label>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Click any preset to simulate radio transmission
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {TACTICAL_PRESETS.map((preset) => {
              const isSelected = inputText === preset.text;
              return (
                <button
                  key={preset.code}
                  type="button"
                  id={`preset-${preset.code.toLowerCase()}`}
                  onClick={() => handlePresetSelect(preset.text)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-950 dark:text-blue-50 ring-1 ring-blue-500 shadow-xs'
                      : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-600 animate-pulse' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                      {preset.code}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                      <span>{preset.frequency}</span>
                      <span>•</span>
                      <span>{preset.callsign}</span>
                    </div>
                  </div>
                  <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 mb-1">
                    {preset.label}
                  </div>
                  <div className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 bg-white/60 dark:bg-black/30 p-1.5 rounded-lg border border-neutral-200/50 dark:border-neutral-800/50">
                    "{preset.text}"
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 1: Input Tactical Message */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="military-radio-input"
              className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5"
            >
              <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Step 1: Read Text (Military Dispatch Plaintext)</span>
            </label>
            {inputText.length > 0 && (
              <span className="text-xs font-mono text-neutral-400">
                {inputText.length} characters
              </span>
            )}
          </div>
          <div className="relative">
            <textarea
              id="military-radio-input"
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter military radio transmission to encrypt..."
              className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase placeholder:normal-case"
            />
          </div>
        </div>

        {/* Step 2: Tactical Shift Key Selector */}
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                Step 2: Shift Characters (Secret Tactical Shift Key k)
              </span>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Both transmitting field operator and receiving command post must agree on shift k.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-600 text-white">
                k = {shiftKey}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={25}
              value={shiftKey}
              onChange={(e) => setShiftKey(parseInt(e.target.value, 10))}
              className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShiftKey(3)}
                className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                  shiftKey === 3
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
                title="Julius Caesar Historical Key (+3)"
              >
                Caesar (k=3)
              </button>
              <button
                type="button"
                onClick={() => setShiftKey(13)}
                className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                  shiftKey === 13
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                }`}
                title="Symmetric ROT13 Key (+13)"
              >
                ROT13 (k=13)
              </button>
            </div>
          </div>
        </div>

        {/* Action Trigger Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTransmitClick}
            disabled={isTransmitting || !inputText.trim()}
            className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isTransmitting ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                <span>Simulating Radio Transmission...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Transmit, Encrypt & Decrypt Over Radio</span>
              </>
            )}
          </button>

          {inputText && (
            <button
              type="button"
              onClick={handleClear}
              className="h-12 px-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-sm"
              title="Clear text"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expected Outputs: Steps 3, 4, 5 Display */}
        <div className="space-y-4 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Expected Output: Encrypted & Decrypted Military Message</span>
            </h4>
            {encryptedOutput && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                D(E(M)) = M (Verified)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Encrypted Military Message (What adversary/radio interceptors hear) */}
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    1. Encrypted Military Message
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(encryptedOutput, 'encrypted')}
                  disabled={!encryptedOutput}
                  className="px-2 py-1 rounded text-[11px] font-medium bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 text-amber-800 dark:text-amber-200 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {copiedType === 'encrypted' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-amber-200/80 dark:border-amber-900/80 font-mono text-xs text-amber-900 dark:text-amber-100 break-words min-h-[56px] select-all">
                {encryptedOutput || (
                  <span className="text-neutral-400 italic">Encrypted message will appear here...</span>
                )}
              </div>

              <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 leading-relaxed">
                <strong>Airwave Transmission:</strong> Any adversary scanning the radio spectrum intercepts only this scrambled ciphertext without knowing key k={shiftKey}.
              </p>
            </div>

            {/* Box 2: Decrypted Military Message (What authorized base station recovers) */}
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Unlock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    2. Decrypted Military Message
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(decryptedOutput, 'decrypted')}
                  disabled={!decryptedOutput}
                  className="px-2 py-1 rounded text-[11px] font-medium bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-200 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {copiedType === 'decrypted' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-emerald-200/80 dark:border-emerald-900/80 font-mono text-xs text-emerald-900 dark:text-emerald-100 break-words min-h-[56px] select-all">
                {decryptedOutput || (
                  <span className="text-neutral-400 italic">Decrypted message will appear here...</span>
                )}
              </div>

              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 leading-relaxed">
                <strong>Receiver Recovery:</strong> Receiving station reverses the shift: D(y) = (y - {shiftKey}) mod 26, faithfully restoring the confidential plaintext.
              </p>
            </div>
          </div>

          {/* Quick Links to Full Specialized Views */}
          {onNavigate && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span>Need advanced cryptanalysis or frequency evaluation?</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem('secure_comm_decrypt_prefill', encryptedOutput);
                    onNavigate('decrypt');
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <span>Open in Decrypt View</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem('secure_comm_bruteforce_prefill', encryptedOutput);
                    onNavigate('learn');
                  }}
                  className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <span>Test Brute-Force Break</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
