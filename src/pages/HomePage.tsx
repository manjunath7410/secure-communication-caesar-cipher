/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  AlertTriangle,
  ArrowRight,
  Clock,
  Copy,
  Check,
  Radio,
  Mic,
  ShieldCheck,
  ChevronRight,
  Settings2,
  Info,
  Sparkles,
  Flame,
  Minus,
  Plus,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { AppView } from '../types/navigation';
import { useOperationsLog } from '../hooks/useOperationsLog';
import { copyToClipboard } from '../utils/clipboard';
import { Logo } from '../components/branding/Logo';
import { useShift } from '../context/ShiftContext';
import { LiveVoiceCopilot } from '../components/audio/LiveVoiceCopilot';
import { AudioTranscribeModal } from '../components/audio/AudioTranscribeModal';

interface HomePageProps {
  onNavigate: (view: AppView) => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onToast }) => {
  const { activities } = useOperationsLog();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showEdu, setShowEdu] = useState(false);
  const { shift, setShift } = useShift();

  // Voice Modals State
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isTranscribeOpen, setIsTranscribeOpen] = useState(false);
  const [transcribeTarget, setTranscribeTarget] = useState<'encrypt' | 'decrypt'>('encrypt');

  const handleCopy = async (id: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      onToast?.('success', 'Copied', 'Message copied to clipboard.');
    }
  };

  const formatRelativeTime = (timestamp: number): string => {
    const diff = Math.max(0, Date.now() - timestamp);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1m ago';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1h ago';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getShiftedChar = (char: string, shiftVal: number) => {
    const code = char.charCodeAt(0);
    return String.fromCharCode(((code - 65 + shiftVal) % 26) + 65);
  };

  const handleIncrementShift = () => {
    setShift((shift + 1) % 26);
  };

  const handleDecrementShift = () => {
    setShift((shift - 1 + 26) % 26);
  };

  const handleOpenTranscribe = (target: 'encrypt' | 'decrypt', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTranscribeTarget(target);
    setIsTranscribeOpen(true);
  };

  const handleTranscribedText = (text: string) => {
    if (transcribeTarget === 'encrypt') {
      onNavigate('encrypt');
    } else {
      onNavigate('decrypt');
    }
    onToast?.('info', 'Voice Dictation Captured', 'Transcribed with gemini-3.5-transcribe.');
  };

  const recentActivities = activities.slice(0, 5);
  const mobileActivities = activities.slice(0, 4);

  // ---------------------------------------------------------------------------
  // DESKTOP PRESENTATION
  // ---------------------------------------------------------------------------
  const renderDesktop = () => (
    <div className="hidden md:block w-full max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Educational Notice Badge */}
      <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-3 transition-colors">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
          <span className="font-semibold">Educational military cryptography platform.</span> Demonstrates classical Caesar Cipher substitution, vulnerability vectors, frequency cryptanalysis, and real-time AI live communications.
        </div>
      </div>

      {/* Hero Banner with Logo */}
      <div className="text-center space-y-3 py-3 flex flex-col items-center">
        <Logo size="2xl" variant="default" id="home-hero-logo" />

        <div className="space-y-1 max-w-lg">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            Secure Military Communication
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
            Caesar Cipher Platform & Tactical Intelligence Operations
          </p>
        </div>
      </div>

      {/* Primary Actions CSS Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Encrypt Card */}
        <div
          onClick={() => onNavigate('encrypt')}
          className="group relative p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg cursor-pointer transition-all flex flex-col justify-between h-[200px]"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-mono font-semibold">
              k = {shift}
            </span>
          </div>

          <div>
            <h3 className="text-xl font-bold tracking-tight mb-1 flex items-center gap-2">
              Encrypt Message
              <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              Encode plaintext dispatches using mathematical alphabet shifting.
            </p>
          </div>

          <div className="pt-2 border-t border-white/15 flex items-center justify-between">
            <span className="text-xs text-blue-200">1-Touch Encryptor</span>
            <button
              type="button"
              onClick={(e) => handleOpenTranscribe('encrypt', e)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-medium text-white transition-colors"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice Dictate</span>
            </button>
          </div>
        </div>

        {/* Decrypt Card */}
        <div
          onClick={() => onNavigate('decrypt')}
          className="group relative p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-slate-900 hover:from-indigo-700 hover:to-slate-950 text-white shadow-md hover:shadow-lg cursor-pointer transition-all flex flex-col justify-between h-[200px]"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <Unlock className="w-6 h-6 text-white" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-mono font-semibold">
              Reverse Shift
            </span>
          </div>

          <div>
            <h3 className="text-xl font-bold tracking-tight mb-1 flex items-center gap-2">
              Decrypt Message
              <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-indigo-100/90 leading-relaxed">
              Decode intercepted ciphertext back into readable plaintext or run cryptanalysis.
            </p>
          </div>

          <div className="pt-2 border-t border-white/15 flex items-center justify-between">
            <span className="text-xs text-indigo-200">Brute-Force & Decryptor</span>
            <button
              type="button"
              onClick={(e) => handleOpenTranscribe('decrypt', e)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-medium text-white transition-colors"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice Dictate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time AI Operations Banner (gemini-3.8-live & gemini-3.5-transcribe) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Live Copilot */}
        <div
          onClick={() => setIsLiveVoiceOpen(true)}
          className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-700 cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Live Voice Copilot
                </h4>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Real-time duplex conversational radio assistant
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-400" />
        </div>

        {/* Audio Transcribe */}
        <div
          onClick={() => handleOpenTranscribe('encrypt')}
          className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-700 cursor-pointer transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Audio Transcription
                </h4>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                  gemini-3.5-transcribe
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Verbatim microphone speech-to-text dictation
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-400" />
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-500" />
            <span>Recent operational activity</span>
          </h2>
          {activities.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View all logs</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {recentActivities.length === 0 ? (
          <div className="p-8 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 text-center space-y-1">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              No recent cipher activity
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Your encrypted and decrypted messages will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivities.map((act) => {
              const isEnc = act.type === 'ENCRYPT';
              return (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs flex items-center justify-between gap-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isEnc
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {isEnc ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          {isEnc ? 'ENCRYPTED' : 'DECRYPTED'}
                        </span>
                        <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          k = {act.shift}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5 font-mono max-w-md">
                        {act.output}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-neutral-400">
                      {formatRelativeTime(act.timestamp)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(act.id, act.output)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Copy message output"
                    >
                      {copiedId === act.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
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
  );

  // ---------------------------------------------------------------------------
  // MOBILE DENSE CSS-GRID DASHBOARD PRESENTATION (Active on screens < 768px)
  // ---------------------------------------------------------------------------
  const renderMobile = () => (
    <div className="block md:hidden w-full px-3.5 pt-4 pb-24 space-y-4">
      {/* 1. Primary 1x2 CSS Grid Action Cards (Overriding landing-page hero layout on mobile < 768px) */}
      <div className="grid grid-cols-2 gap-4">
        {/* ENCRYPT CARD - Elevated Tactical Blue Surface */}
        <div
          id="mobile-encrypt-card"
          onClick={() => onNavigate('encrypt')}
          className="relative rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white border border-blue-400/30 shadow-lg hover:shadow-xl shadow-blue-600/15 flex flex-col justify-between min-h-[180px] active:scale-[0.98] transition-all cursor-pointer overflow-hidden group"
        >
          {/* Top Row: Prominent Action Icon & Key Chip */}
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-md border border-white/25 group-hover:scale-105 transition-transform">
              <Lock className="w-6 h-6 text-white drop-shadow-xs" />
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-black/25 backdrop-blur-xs border border-white/20 text-xs font-mono font-bold text-blue-100 shadow-2xs">
              k = {shift}
            </span>
          </div>

          {/* Central Title & Label */}
          <div className="my-auto py-2.5">
            <h3 className="text-lg sm:text-xl font-black tracking-tight uppercase leading-tight">
              Encrypt
            </h3>
            <p className="text-xs text-blue-100/90 font-medium leading-tight mt-0.5">
              Encode Plaintext
            </p>
          </div>

          {/* Bottom Action Tray: Voice Dictation & Arrow */}
          <div className="flex items-center justify-between pt-2.5 border-t border-white/20">
            <button
              type="button"
              onClick={(e) => handleOpenTranscribe('encrypt', e)}
              className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold backdrop-blur-xs border border-white/20"
              title="Dictate message with microphone"
            >
              <Mic className="w-3.5 h-3.5 text-blue-200" />
              <span>Voice</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-white text-blue-700 flex items-center justify-center shadow-md group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* DECRYPT CARD - Elevated Tactical Indigo/Purple Surface */}
        <div
          id="mobile-decrypt-card"
          onClick={() => onNavigate('decrypt')}
          className="relative rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-indigo-700 via-purple-800 to-slate-900 text-white border border-indigo-400/30 shadow-lg hover:shadow-xl shadow-indigo-600/15 flex flex-col justify-between min-h-[180px] active:scale-[0.98] transition-all cursor-pointer overflow-hidden group"
        >
          {/* Top Row: Prominent Action Icon & Decipher Badge */}
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-md border border-white/25 group-hover:scale-105 transition-transform">
              <Unlock className="w-6 h-6 text-white drop-shadow-xs" />
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-black/25 backdrop-blur-xs border border-white/20 text-xs font-mono font-bold text-indigo-100 shadow-2xs">
              Decipher
            </span>
          </div>

          {/* Central Title & Label */}
          <div className="my-auto py-2.5">
            <h3 className="text-lg sm:text-xl font-black tracking-tight uppercase leading-tight">
              Decrypt
            </h3>
            <p className="text-xs text-indigo-100/90 font-medium leading-tight mt-0.5">
              Decode Ciphertext
            </p>
          </div>

          {/* Bottom Action Tray: Voice Dictation & Arrow */}
          <div className="flex items-center justify-between pt-2.5 border-t border-white/20">
            <button
              type="button"
              onClick={(e) => handleOpenTranscribe('decrypt', e)}
              className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold backdrop-blur-xs border border-white/20"
              title="Dictate ciphertext with microphone"
            >
              <Mic className="w-3.5 h-3.5 text-indigo-200" />
              <span>Voice</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-white text-indigo-700 flex items-center justify-center shadow-md group-hover:translate-x-0.5 transition-transform">
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tactical Security & Operational Status Bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 shadow-2xs border border-neutral-200/90 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Tactical Engine Online
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Hardware biometric lock & cipher active
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Real-Time AI Intelligence Grid (Live API & Transcribe) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Live Tactical Voice Card */}
        <div
          onClick={() => setIsLiveVoiceOpen(true)}
          className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs flex flex-col justify-between active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <span className="text-[9px] font-mono uppercase font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
              Live Duplex
            </span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
              Voice Copilot
            </h4>
            <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
              gemini-3.8-live
            </p>
          </div>
        </div>

        {/* Audio Transcribe Card */}
        <div
          onClick={() => handleOpenTranscribe('encrypt')}
          className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xs flex flex-col justify-between active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
              Transcribe
            </span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
              Voice Dictation
            </h4>
            <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
              gemini-3.5-transcribe
            </p>
          </div>
        </div>
      </div>

      {/* 4. Active Shift Quick Wheel Controller */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-3.5 border border-neutral-200 dark:border-neutral-800 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
              Shift Key Controller
            </span>
            <button
              type="button"
              onClick={() => setShift(13)}
              className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border transition-colors ${
                shift === 13
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
              }`}
            >
              ROT13
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDecrementShift}
              className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center active:scale-95 transition-all"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-12 text-center text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
              k = {shift}
            </span>
            <button
              type="button"
              onClick={handleIncrementShift}
              className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Alphabet Mapping Strip */}
        <div className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-600 dark:text-neutral-300">
          <span>A→{getShiftedChar('A', shift)}</span>
          <span>B→{getShiftedChar('B', shift)}</span>
          <span>C→{getShiftedChar('C', shift)}</span>
          <span>M→{getShiftedChar('M', shift)}</span>
          <span>Z→{getShiftedChar('Z', shift)}</span>
        </div>
      </div>

      {/* 5. Quick Cryptanalysis / Brute-Force Card */}
      <div
        onClick={() => onNavigate('bruteforce')}
        className="bg-neutral-900 text-white rounded-2xl p-3.5 border border-neutral-800 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-wide">
              Brute-Force Attack Analyzer
            </h4>
            <p className="text-[10px] text-neutral-400">
              Test all 25 shift permutations in parallel
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-neutral-400" />
      </div>

      {/* 6. Recent Activity Log Feed */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            Recent Activity
          </span>
          {activities.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400"
            >
              View all
            </button>
          )}
        </div>

        {mobileActivities.length === 0 ? (
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-500">
            No cipher messages logged yet. Encrypt your first dispatch above!
          </div>
        ) : (
          <div className="space-y-2">
            {mobileActivities.map((act) => {
              const isEnc = act.type === 'ENCRYPT';
              return (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isEnc
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {isEnc ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-neutral-900 dark:text-neutral-100">
                          {isEnc ? 'ENCRYPT' : 'DECRYPT'}
                        </span>
                        <span className="text-[10px] font-mono px-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          k={act.shift}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {formatRelativeTime(act.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 truncate max-w-[180px]">
                        {act.output}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(act.id, act.output)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 shrink-0"
                  >
                    {copiedId === act.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Educational Collapsible Notice */}
      <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => setShowEdu(!showEdu)}
          className="w-full p-3 flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300 font-medium"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-neutral-400" />
            <span>Educational Research Cipher</span>
          </div>
          <ChevronRight
            className={`w-4 h-4 text-neutral-400 transition-transform ${showEdu ? 'rotate-90' : ''}`}
          />
        </button>
        {showEdu && (
          <div className="px-3 pb-3 text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed border-t border-neutral-200/60 dark:border-neutral-800 pt-2">
            Classical Caesar Cipher is intended for cryptographic study and algorithmic analysis. Modern communications require AES-256 or Post-Quantum Cryptography.
            <div className="mt-2">
              <button
                type="button"
                onClick={() => onNavigate('learn')}
                className="text-blue-600 dark:text-blue-400 font-semibold"
              >
                Explore Cryptography Module →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {renderDesktop()}
      {renderMobile()}

      {/* Real-time Voice Tactical Copilot (gemini-3.8-live) */}
      <LiveVoiceCopilot
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        onToast={onToast}
      />

      {/* Real-time Microphone Audio Transcriber (gemini-3.5-transcribe) */}
      <AudioTranscribeModal
        isOpen={isTranscribeOpen}
        onClose={() => setIsTranscribeOpen(false)}
        onInsertText={handleTranscribedText}
        targetFieldLabel={transcribeTarget === 'encrypt' ? 'Encryptor' : 'Decryptor'}
        defaultMode={transcribeTarget}
      />
    </>
  );
};
