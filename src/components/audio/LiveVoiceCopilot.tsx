/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  Send,
  X,
  Shield,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Lock,
  Unlock,
  Copy,
  Check,
  Cpu,
  Key,
  ExternalLink,
  Save,
  RadioTower,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  LiveVoiceClient,
  LiveVoiceMessage,
  LiveVoiceState,
  CryptoActionResult,
} from '../../services/liveVoiceService';
import { useShift } from '../../context/ShiftContext';
import { encrypt, decrypt, normalizeShift } from '../../services/caesarCipher';
import { executeBruteForceAttack } from '../../services/bruteForceService';
import { messageService } from '../../services/messageService';
import { copyToClipboard } from '../../utils/clipboard';
import { AppView } from '../../types/navigation';

interface LiveVoiceCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
  onNavigate?: (view: AppView) => void;
}

export const LiveVoiceCopilot: React.FC<LiveVoiceCopilotProps> = ({
  isOpen,
  onClose,
  onToast,
  onNavigate,
}) => {
  const { shift: currentAppShift, setShift: setAppShift } = useShift();

  const [voiceState, setVoiceState] = useState<LiveVoiceState>('idle');
  const [messages, setMessages] = useState<LiveVoiceMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [inputVolume, setInputVolume] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const clientRef = useRef<LiveVoiceClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Play realistic tactical radio sound telemetry
  const playRadioBeep = useCallback((freq = 880, duration = 0.08) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, []);

  const playTransmissionSquelch = useCallback(() => {
    setIsBroadcasting(true);
    playRadioBeep(660, 0.06);
    setTimeout(() => playRadioBeep(880, 0.07), 80);
    setTimeout(() => playRadioBeep(1100, 0.1), 170);
    setTimeout(() => setIsBroadcasting(false), 800);
  }, [playRadioBeep]);

  // Auto-scroll message feed
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle incoming tool call execution from Gemini Live
  const handleServerCryptoAction = useCallback((action: string, result: CryptoActionResult) => {
    playRadioBeep(980, 0.06);

    // Apply global side effects
    if (result.operation === 'SET_SHIFT' && typeof result.shift === 'number') {
      setAppShift(result.shift);
      onToast?.('info', 'Caesar Shift Updated', `Active shift key updated to k=${result.shift}`);
    } else if (result.operation === 'NAVIGATE' && result.page && onNavigate) {
      onNavigate(result.page as AppView);
      onToast?.('info', 'Tactical Navigation', `Switched view to ${result.page}`);
    } else if (result.operation === 'RADIO_BROADCAST') {
      playTransmissionSquelch();
      onToast?.('success', 'Radio Broadcast Dispatched', 'Simulated transmission over 142.850 MHz');
    }

    // Append cryptographic action card into message history
    const actionMsgId = `action-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    let summaryText = '';
    if (result.operation === 'ENCRYPT') {
      summaryText = `Encrypted "${result.plaintext}" using shift k=${result.shift} -> "${result.ciphertext}"`;
    } else if (result.operation === 'DECRYPT') {
      summaryText = `Decrypted "${result.ciphertext}" using shift k=${result.shift} -> "${result.plaintext}"`;
    } else if (result.operation === 'BRUTE_FORCE') {
      summaryText = `Brute-force crack identified shift k=${result.topCandidate?.shift}: "${result.topCandidate?.candidatePlaintext}"`;
    } else if (result.operation === 'SET_SHIFT') {
      summaryText = `Active Caesar shift key updated to k=${result.shift}.`;
    } else if (result.operation === 'NAVIGATE') {
      summaryText = `Navigating operator terminal to "${result.page}".`;
    } else if (result.operation === 'VAULT_SAVED') {
      summaryText = `Encrypted record saved to tactical vault (Record ID: ${result.id}).`;
    } else if (result.operation === 'RADIO_BROADCAST') {
      summaryText = `Tactical radio broadcast dispatched over frequency 142.850 MHz.`;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: actionMsgId,
        sender: 'assistant',
        text: summaryText,
        timestamp: Date.now(),
        cryptoResult: result,
      },
    ]);
  }, [onNavigate, onToast, playRadioBeep, playTransmissionSquelch, setAppShift]);

  // Execute client-side cryptographic command parser for zero-latency local fallback
  const parseAndExecuteCryptoIntent = useCallback((input: string): boolean => {
    const raw = input.trim();
    const lower = raw.toLowerCase();

    // 1. Encrypt intent: e.g. "encrypt hello with shift 3", "encrypt attack at dawn (k=7)", "encrypt test rot13"
    const encryptMatch = lower.match(/^encrypt\s+(?:message\s+|text\s+)?["']?(.+?)["']?\s+(?:with\s+|using\s+)?(?:shift|key)?\s*[:=]?\s*(\d+|rot13)?$/i);
    const encryptSimple = lower.startsWith('encrypt ') && !lower.includes('explain');

    if (encryptMatch || encryptSimple) {
      let targetText = '';
      let targetShift = currentAppShift;

      if (encryptMatch) {
        targetText = encryptMatch[1];
        if (encryptMatch[2]) {
          targetShift = encryptMatch[2].toLowerCase() === 'rot13' ? 13 : parseInt(encryptMatch[2], 10);
        }
      } else {
        // Fallback simple extract
        const afterEncrypt = raw.slice(8).trim();
        const withShiftIdx = afterEncrypt.toLowerCase().indexOf('with shift');
        if (withShiftIdx !== -1) {
          targetText = afterEncrypt.slice(0, withShiftIdx).trim().replace(/^["']|["']$/g, '');
          const shiftPart = afterEncrypt.slice(withShiftIdx + 10).trim();
          targetShift = parseInt(shiftPart, 10) || currentAppShift;
        } else {
          targetText = afterEncrypt.replace(/^["']|["']$/g, '');
        }
      }

      const shiftNorm = normalizeShift(targetShift);
      const ct = encrypt(targetText, shiftNorm);
      const result: CryptoActionResult = {
        operation: 'ENCRYPT',
        plaintext: targetText,
        shift: shiftNorm,
        ciphertext: ct,
        formula: `E(x) = (x + ${shiftNorm}) mod 26`,
      };

      handleServerCryptoAction('encrypt_message', result);
      return true;
    }

    // 2. Decrypt intent: e.g. "decrypt dwwdfn with shift 3", "decrypt ubb"
    const decryptMatch = lower.match(/^decrypt\s+(?:message\s+|ciphertext\s+)?["']?(.+?)["']?\s+(?:with\s+|using\s+)?(?:shift|key)?\s*[:=]?\s*(\d+|rot13)?$/i);
    const decryptSimple = lower.startsWith('decrypt ') && !lower.includes('explain');

    if (decryptMatch || decryptSimple) {
      let targetCt = '';
      let targetShift = currentAppShift;

      if (decryptMatch) {
        targetCt = decryptMatch[1];
        if (decryptMatch[2]) {
          targetShift = decryptMatch[2].toLowerCase() === 'rot13' ? 13 : parseInt(decryptMatch[2], 10);
        }
      } else {
        const afterDecrypt = raw.slice(8).trim();
        const withShiftIdx = afterDecrypt.toLowerCase().indexOf('with shift');
        if (withShiftIdx !== -1) {
          targetCt = afterDecrypt.slice(0, withShiftIdx).trim().replace(/^["']|["']$/g, '');
          const shiftPart = afterDecrypt.slice(withShiftIdx + 10).trim();
          targetShift = parseInt(shiftPart, 10) || currentAppShift;
        } else {
          targetCt = afterDecrypt.replace(/^["']|["']$/g, '');
        }
      }

      const shiftNorm = normalizeShift(targetShift);
      const pt = decrypt(targetCt, shiftNorm);
      const result: CryptoActionResult = {
        operation: 'DECRYPT',
        ciphertext: targetCt,
        shift: shiftNorm,
        plaintext: pt,
        formula: `D(x) = (x - ${shiftNorm}) mod 26`,
      };

      handleServerCryptoAction('decrypt_message', result);
      return true;
    }

    // 3. Brute force / crack intent
    if (lower.startsWith('brute force ') || lower.startsWith('crack ') || lower.startsWith('break ')) {
      const ct = raw.replace(/^(brute force|crack|break)\s+(?:ciphertext\s+)?/i, '').trim().replace(/^["']|["']$/g, '');
      if (ct) {
        const analysis = executeBruteForceAttack(ct);
        const result: CryptoActionResult = {
          operation: 'BRUTE_FORCE',
          ciphertext: ct,
          topCandidate: {
            shift: analysis.topCandidate.shift,
            candidatePlaintext: analysis.topCandidate.candidatePlaintext,
            score: analysis.topCandidate.score,
            isRot13: analysis.topCandidate.isRot13,
          },
          topCandidates: analysis.candidates.slice(0, 5).map((c) => ({
            shift: c.shift,
            candidatePlaintext: c.candidatePlaintext,
            score: c.score,
            isRot13: c.isRot13,
          })),
        };

        handleServerCryptoAction('brute_force_cryptanalysis', result);
        return true;
      }
    }

    // 4. Set shift intent
    const setShiftMatch = lower.match(/^(?:set|change)\s+shift\s+(?:to\s+)?(\d+|rot13)$/i);
    if (setShiftMatch) {
      const newS = setShiftMatch[1].toLowerCase() === 'rot13' ? 13 : parseInt(setShiftMatch[1], 10);
      const shiftNorm = normalizeShift(newS);
      const result: CryptoActionResult = {
        operation: 'SET_SHIFT',
        shift: shiftNorm,
      };
      handleServerCryptoAction('set_active_shift', result);
      return true;
    }

    // 5. Navigation intent
    if (lower.includes('go to encrypt') || lower.includes('open encrypt')) {
      handleServerCryptoAction('navigate_to_page', { operation: 'NAVIGATE', page: 'encrypt' });
      return true;
    }
    if (lower.includes('go to decrypt') || lower.includes('open decrypt')) {
      handleServerCryptoAction('navigate_to_page', { operation: 'NAVIGATE', page: 'decrypt' });
      return true;
    }
    if (lower.includes('go to history') || lower.includes('open history') || lower.includes('open vault')) {
      handleServerCryptoAction('navigate_to_page', { operation: 'NAVIGATE', page: 'history' });
      return true;
    }
    if (lower.includes('go to learn') || lower.includes('open learn')) {
      handleServerCryptoAction('navigate_to_page', { operation: 'NAVIGATE', page: 'learn' });
      return true;
    }
    if (lower.includes('go to brute force') || lower.includes('open brute force')) {
      handleServerCryptoAction('navigate_to_page', { operation: 'NAVIGATE', page: 'bruteforce' });
      return true;
    }
    if (lower.includes('go to settings') || lower.includes('open settings')) {
      handleServerCryptoAction('navigate_to_page', { operation: 'NAVIGATE', page: 'settings' });
      return true;
    }

    // 6. Broadcast intent
    if (lower.startsWith('broadcast ') || lower.startsWith('transmit ')) {
      const msg = raw.replace(/^(broadcast|transmit)\s+/i, '').trim();
      handleServerCryptoAction('simulate_radio_broadcast', {
        operation: 'RADIO_BROADCAST',
        message: msg,
      });
      return true;
    }

    return false;
  }, [currentAppShift, handleServerCryptoAction]);

  const startLiveSession = async () => {
    setErrorMessage(null);
    setMessages([
      {
        id: 'init-msg',
        sender: 'assistant',
        text: 'Tactical Voice Copilot online (gemini-3.8-live with Tool Calling). Ready to perform live encryption, decryption, brute-force recovery, frequency intelligence, and radio transmissions on your voice or text command.',
        timestamp: Date.now(),
      },
    ]);

    try {
      if (!clientRef.current) {
        clientRef.current = new LiveVoiceClient({
          onStateChange: (state) => setVoiceState(state),
          onMessage: (message) => {
            setMessages((prev) => [...prev, message]);
          },
          onVolumeChange: (inVol) => {
            setInputVolume(inVol);
          },
          onError: (err) => {
            setErrorMessage(err);
            onToast?.('error', 'Live Voice Error', err);
          },
          onCryptoAction: (action, result) => {
            handleServerCryptoAction(action, result);
          },
        });
      }

      await clientRef.current.connect();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start Live Voice session.';
      setErrorMessage(msg);
    }
  };

  const cleanupLiveSession = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setVoiceState('idle');
    setInputVolume(0);
  };

  useEffect(() => {
    if (isOpen) {
      startLiveSession();
    } else {
      cleanupLiveSession();
    }

    return () => {
      cleanupLiveSession();
    };
  }, [isOpen]);

  const handleToggleMute = () => {
    if (clientRef.current) {
      const muted = clientRef.current.toggleMute();
      setIsMuted(muted);
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    const query = textInput.trim();
    setTextInput('');

    // Add user message to UI stream
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: query,
        timestamp: Date.now(),
      },
    ]);

    // Check if client-side instant parser matches
    const handledLocally = parseAndExecuteCryptoIntent(query);

    // Send to Gemini Live session if connected
    if (clientRef.current) {
      clientRef.current.sendTextMessage(query);
    } else if (!handledLocally) {
      // Local fallback reply if offline
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `reply-${Date.now()}`,
            sender: 'assistant',
            text: `Command received: "${query}". Connecting live radio uplink...`,
            timestamp: Date.now(),
          },
        ]);
      }, 300);
    }
  };

  const handleQuickCommand = (prompt: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: prompt,
        timestamp: Date.now(),
      },
    ]);

    parseAndExecuteCryptoIntent(prompt);

    if (clientRef.current) {
      clientRef.current.sendTextMessage(prompt);
    }
  };

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      onToast?.('success', 'Copied to Clipboard', text);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleApplyShift = (shiftVal: number) => {
    setAppShift(shiftVal);
    onToast?.('success', 'Shift Key Applied', `Global shift updated to k=${shiftVal}`);
  };

  const handleVaultMessage = async (result: CryptoActionResult) => {
    try {
      const text = result.ciphertext || result.plaintext || '';
      const shiftVal = result.shift ?? currentAppShift;
      const op = result.operation === 'DECRYPT' ? 'DECRYPT' : 'ENCRYPT';
      await messageService.createMessage({
        ciphertext: text,
        shift: shiftVal,
        operationType: op,
        notes: `Vaulted from Live Voice Copilot [k=${shiftVal}]`,
      });
      onToast?.('success', 'Message Vaulted', 'Stored in authenticated encrypted records.');
    } catch {
      onToast?.('error', 'Vault Save Failed', 'Sign in to sync with persistent vault.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="live-voice-copilot-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-3xl h-full sm:h-[88vh] bg-white dark:bg-neutral-900 sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Tactical Status Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-900/90 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
                <Radio className="w-5 h-5" />
              </div>
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900 ${
                  voiceState === 'listening'
                    ? 'bg-emerald-500 animate-pulse'
                    : voiceState === 'speaking'
                    ? 'bg-blue-500 animate-ping'
                    : voiceState === 'connecting'
                    ? 'bg-amber-500 animate-spin'
                    : 'bg-neutral-400'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Live Voice Cryptographic Copilot
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold uppercase">
                  gemini-3.8-live
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-semibold uppercase">
                  Tool-Calling Active
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                Live Duplex Crypto Operations • Active Key: k={currentAppShift}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-2 sm:p-2.5 rounded-xl border transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-600'
                  : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 sm:p-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Central Tactical Radio Visualizer & Audio Orb */}
        <div className="relative py-6 px-6 bg-gradient-to-b from-neutral-50 via-neutral-100/70 to-neutral-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 border-b border-neutral-200/80 dark:border-neutral-800/80 flex flex-col items-center justify-center shrink-0">
          <div className="relative flex items-center justify-center my-1">
            {/* Audio pulse wave rings */}
            <div
              className={`absolute rounded-full border border-blue-400/30 dark:border-blue-500/20 transition-all duration-150 ${
                voiceState === 'listening' || voiceState === 'speaking' || isBroadcasting ? 'opacity-100 scale-125' : 'opacity-0 scale-95'
              }`}
              style={{
                width: `${90 + inputVolume * 65}px`,
                height: `${90 + inputVolume * 65}px`,
              }}
            />

            {/* Glowing Tactical Orb */}
            <div
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                isBroadcasting
                  ? 'bg-gradient-to-tr from-amber-500 via-rose-600 to-red-600 shadow-rose-500/50 scale-110 animate-ping'
                  : voiceState === 'speaking'
                  ? 'bg-gradient-to-tr from-cyan-400 via-blue-600 to-indigo-700 shadow-blue-500/50 scale-105'
                  : voiceState === 'listening'
                  ? 'bg-gradient-to-tr from-emerald-500 via-teal-600 to-blue-700 shadow-emerald-500/40'
                  : voiceState === 'connecting'
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-600 shadow-amber-500/30 animate-spin'
                  : 'bg-neutral-600 shadow-neutral-500/20'
              }`}
            >
              {isBroadcasting ? (
                <RadioTower className="w-8 h-8 text-white animate-pulse" />
              ) : voiceState === 'speaking' ? (
                <Volume2 className="w-8 h-8 text-white animate-bounce" />
              ) : voiceState === 'connecting' ? (
                <RefreshCw className="w-7 h-7 text-white animate-spin" />
              ) : isMuted ? (
                <MicOff className="w-8 h-8 text-white/70" />
              ) : (
                <Radio className="w-8 h-8 text-white" />
              )}
            </div>
          </div>

          {/* Voice State Badge */}
          <div className="mt-2.5 flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                isBroadcasting
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 animate-pulse'
                  : voiceState === 'speaking'
                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  : voiceState === 'listening'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : voiceState === 'connecting'
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {isBroadcasting ? (
                <>
                  <RadioTower className="w-3.5 h-3.5" /> Transmitting 142.850 MHz...
                </>
              ) : voiceState === 'speaking' ? (
                'Copilot Speaking'
              ) : voiceState === 'listening' ? (
                isMuted ? 'Microphone Muted' : 'Listening... (Speak your cryptographic instruction)'
              ) : voiceState === 'connecting' ? (
                'Establishing Tactical Link...'
              ) : (
                'Offline'
              )}
            </span>
          </div>

          {/* Quick Voice / Text Command Chips */}
          <div className="mt-3.5 w-full flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 whitespace-nowrap pl-1">
              Live Actions:
            </span>
            <button
              type="button"
              onClick={() => handleQuickCommand('Encrypt "ATTACK AT DAWN" with shift 3')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 whitespace-nowrap active:scale-95 transition-all cursor-pointer font-medium flex items-center gap-1.5 shadow-2xs"
            >
              <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Encrypt "ATTACK AT DAWN" (k=3)
            </button>
            <button
              type="button"
              onClick={() => handleQuickCommand('Decrypt "DWWDFN DW GDZQ" with shift 3')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 whitespace-nowrap active:scale-95 transition-all cursor-pointer font-medium flex items-center gap-1.5 shadow-2xs"
            >
              <Unlock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              Decrypt "DWWDFN DW GDZQ" (k=3)
            </button>
            <button
              type="button"
              onClick={() => handleQuickCommand('Encrypt "OPERATION ZEPHYR" with ROT13')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 whitespace-nowrap active:scale-95 transition-all cursor-pointer font-medium flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCcw className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              Encrypt with ROT13 (k=13)
            </button>
            <button
              type="button"
              onClick={() => handleQuickCommand('Brute force crack "URYYB JBEYQ"')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 whitespace-nowrap active:scale-95 transition-all cursor-pointer font-medium flex items-center gap-1.5 shadow-2xs"
            >
              <Cpu className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              Brute-Force "URYYB JBEYQ"
            </button>
            <button
              type="button"
              onClick={() => handleQuickCommand('Set shift to 13')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 whitespace-nowrap active:scale-95 transition-all cursor-pointer font-medium flex items-center gap-1.5 shadow-2xs"
            >
              <Key className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              Set Shift to 13 (ROT13)
            </button>
            <button
              type="button"
              onClick={() => handleQuickCommand('Simulate radio broadcast "SQUADRON DELTA DISPATCH"')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 whitespace-nowrap active:scale-95 transition-all cursor-pointer font-medium flex items-center gap-1.5 shadow-2xs"
            >
              <RadioTower className="w-3 h-3 text-rose-600 dark:text-rose-400" />
              Broadcast on Radio
            </button>
            <button
              type="button"
              onClick={() => handleQuickCommand('Go to encrypt page')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 whitespace-nowrap active:scale-95 transition-all cursor-pointer font-medium flex items-center gap-1.5 shadow-2xs"
            >
              <ExternalLink className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
              Open Encryptor
            </button>
          </div>
        </div>

        {/* Live Conversation Transcript Feed */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-neutral-50/50 dark:bg-neutral-950/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className="max-w-[88%] sm:max-w-[80%] space-y-2.5">
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-[10px] opacity-60 mt-1 block text-right font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                {/* Rich Live Cryptographic Action Card */}
                {msg.cryptoResult && (
                  <div className="rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-100 p-4 space-y-3.5 shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header badge */}
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            msg.cryptoResult.operation === 'ENCRYPT'
                              ? 'bg-emerald-400 animate-pulse'
                              : msg.cryptoResult.operation === 'DECRYPT'
                              ? 'bg-blue-400 animate-pulse'
                              : msg.cryptoResult.operation === 'BRUTE_FORCE'
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-purple-400'
                          }`}
                        />
                        <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-neutral-300">
                          {msg.cryptoResult.operation === 'ENCRYPT' && 'Live Encryption Executed'}
                          {msg.cryptoResult.operation === 'DECRYPT' && 'Live Decryption Executed'}
                          {msg.cryptoResult.operation === 'BRUTE_FORCE' && 'Brute-Force Cryptanalysis Complete'}
                          {msg.cryptoResult.operation === 'SET_SHIFT' && 'Active Shift Key Synchronized'}
                          {msg.cryptoResult.operation === 'NAVIGATE' && 'Tactical Terminal Navigation'}
                          {msg.cryptoResult.operation === 'VAULT_SAVED' && 'Vaulted Message Record Created'}
                          {msg.cryptoResult.operation === 'RADIO_BROADCAST' && 'Military Radio Transmission'}
                        </span>
                      </div>
                      {typeof msg.cryptoResult.shift === 'number' && (
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                          Shift k={msg.cryptoResult.shift}
                        </span>
                      )}
                    </div>

                    {/* ENCRYPT card layout */}
                    {msg.cryptoResult.operation === 'ENCRYPT' && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                          <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                            <span className="text-[10px] text-neutral-500 uppercase font-semibold">Plaintext Input</span>
                            <p className="text-neutral-200 break-all select-all font-medium">{msg.cryptoResult.plaintext}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-1">
                            <span className="text-[10px] text-emerald-400 uppercase font-semibold">Generated Ciphertext</span>
                            <p className="text-emerald-300 break-all select-all font-bold">{msg.cryptoResult.ciphertext}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.cryptoResult?.ciphertext || '')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition-colors cursor-pointer"
                          >
                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy Ciphertext'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyShift(msg.cryptoResult?.shift ?? 3)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/50 text-xs font-medium text-blue-300 transition-colors cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Apply Shift k={msg.cryptoResult.shift}</span>
                          </button>
                          <button
                            type="button"
                            onClick={playTransmissionSquelch}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 text-xs font-medium text-purple-300 transition-colors cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Radio Squelch</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVaultMessage(msg.cryptoResult!)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 transition-colors cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save to Vault</span>
                          </button>
                          {onNavigate && (
                            <button
                              type="button"
                              onClick={() => onNavigate('encrypt')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Encrypt Page</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* DECRYPT card layout */}
                    {msg.cryptoResult.operation === 'DECRYPT' && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                          <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                            <span className="text-[10px] text-neutral-500 uppercase font-semibold">Ciphertext Input</span>
                            <p className="text-neutral-300 break-all select-all font-medium">{msg.cryptoResult.ciphertext}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/60 space-y-1">
                            <span className="text-[10px] text-blue-400 uppercase font-semibold">Recovered Plaintext</span>
                            <p className="text-blue-300 break-all select-all font-bold">{msg.cryptoResult.plaintext}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.cryptoResult?.plaintext || '')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition-colors cursor-pointer"
                          >
                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy Plaintext'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyShift(msg.cryptoResult?.shift ?? 3)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/50 text-xs font-medium text-blue-300 transition-colors cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Apply Shift k={msg.cryptoResult.shift}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVaultMessage(msg.cryptoResult!)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 transition-colors cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save to Vault</span>
                          </button>
                          {onNavigate && (
                            <button
                              type="button"
                              onClick={() => onNavigate('decrypt')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Decrypt Page</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* BRUTE_FORCE card layout */}
                    {msg.cryptoResult.operation === 'BRUTE_FORCE' && (
                      <div className="space-y-2.5">
                        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 space-y-1 text-xs">
                          <span className="text-[10px] text-amber-400 uppercase font-semibold">
                            Identified Plaintext Candidate (Shift k={msg.cryptoResult.topCandidate?.shift})
                          </span>
                          <p className="font-mono text-sm font-bold text-amber-200 select-all break-all">
                            "{msg.cryptoResult.topCandidate?.candidatePlaintext}"
                          </p>
                        </div>

                        {msg.cryptoResult.topCandidates && msg.cryptoResult.topCandidates.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-neutral-400 uppercase font-semibold">Top Ranked Shifts</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {msg.cryptoResult.topCandidates.map((c, i) => (
                                <div
                                  key={i}
                                  className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono flex items-center justify-between"
                                >
                                  <span className="text-neutral-400">k={c.shift}:</span>
                                  <span className="text-neutral-200 truncate max-w-[140px]">"{c.candidatePlaintext}"</span>
                                  <span className="text-neutral-500 text-[10px]">{c.score}pts</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.cryptoResult?.topCandidate?.candidatePlaintext || '')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Recovered Plaintext</span>
                          </button>
                          {msg.cryptoResult.topCandidate && (
                            <button
                              type="button"
                              onClick={() => handleApplyShift(msg.cryptoResult!.topCandidate!.shift)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/50 text-xs font-medium text-amber-300 transition-colors cursor-pointer"
                            >
                              <Key className="w-3.5 h-3.5" />
                              <span>Apply Shift k={msg.cryptoResult.topCandidate.shift}</span>
                            </button>
                          )}
                          {onNavigate && (
                            <button
                              type="button"
                              onClick={() => onNavigate('bruteforce')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Full Brute Force Analyzer</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* RADIO_BROADCAST card layout */}
                    {msg.cryptoResult.operation === 'RADIO_BROADCAST' && (
                      <div className="space-y-2 p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-purple-400 font-semibold">Frequency: 142.850 MHz Tactical FM</span>
                          <span className="text-purple-300 text-[10px]">Airwaves Active</span>
                        </div>
                        <p className="text-purple-100 break-all select-all">Payload: "{msg.cryptoResult.message}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-950/50 border-t border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 text-center">
            {errorMessage}
          </div>
        )}

        {/* Bottom Control & Text Fallback Command Bar */}
        <div className="p-3.5 sm:p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <form onSubmit={handleSendText} className="flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Speak aloud or type: e.g. 'Encrypt ATTACK AT DAWN with shift 3'..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-neutral-400"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
              title="Send command"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
