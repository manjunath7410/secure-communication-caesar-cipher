/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  VolumeX,
  PhoneOff,
  Sparkles,
  RefreshCw,
  Send,
  X,
  ChevronRight,
  Shield,
  Bot,
  User,
} from 'lucide-react';
import { LiveVoiceClient, LiveVoiceMessage, LiveVoiceState } from '../../services/liveVoiceService';

interface LiveVoiceCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  onToast?: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
}

export const LiveVoiceCopilot: React.FC<LiveVoiceCopilotProps> = ({
  isOpen,
  onClose,
  onToast,
}) => {
  const [voiceState, setVoiceState] = useState<LiveVoiceState>('idle');
  const [messages, setMessages] = useState<LiveVoiceMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [inputVolume, setInputVolume] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clientRef = useRef<LiveVoiceClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const startLiveSession = async () => {
    setErrorMessage(null);
    setMessages([
      {
        id: 'init-msg',
        sender: 'assistant',
        text: 'Tactical Voice Copilot online (gemini-3.8-live). Standing by for secure frequency communications, cipher calculations, or operational dispatch analysis.',
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
        });
      }

      await clientRef.current.connect();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to start Live Voice session.');
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

  const handleToggleMute = () => {
    if (clientRef.current) {
      const muted = clientRef.current.toggleMute();
      setIsMuted(muted);
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !clientRef.current) return;

    clientRef.current.sendTextMessage(textInput.trim());
    setTextInput('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (clientRef.current) {
      clientRef.current.sendTextMessage(prompt);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="live-voice-copilot-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-2xl h-full sm:h-[85vh] bg-white dark:bg-neutral-900 sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top App Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
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
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Live Voice Tactical Copilot
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold uppercase">
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                Real-Time Duplex Voice Frequency (PCM 16k/24k)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-2.5 rounded-xl border transition-colors ${
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
              className="p-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Central Tactical Orb & Audio Visualizer */}
        <div className="relative py-8 px-6 bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950/80 dark:to-neutral-900 border-b border-neutral-100 dark:border-neutral-800/80 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center my-2">
            {/* Reactive audio pulse rings */}
            <div
              className="absolute rounded-full bg-blue-500/10 transition-all duration-150"
              style={{
                width: `${120 + inputVolume * 100}px`,
                height: `${120 + inputVolume * 100}px`,
              }}
            />
            <div
              className="absolute rounded-full bg-indigo-500/20 transition-all duration-100"
              style={{
                width: `${90 + inputVolume * 60}px`,
                height: `${90 + inputVolume * 60}px`,
              }}
            />

            {/* Glowing Center Orb */}
            <div
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                voiceState === 'speaking'
                  ? 'bg-gradient-to-tr from-cyan-400 via-blue-600 to-indigo-700 shadow-blue-500/50 scale-105 animate-pulse'
                  : voiceState === 'listening'
                  ? 'bg-gradient-to-tr from-blue-500 via-indigo-600 to-violet-700 shadow-indigo-500/40'
                  : voiceState === 'connecting'
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-600 shadow-amber-500/30 animate-spin'
                  : 'bg-neutral-600 shadow-neutral-500/20'
              }`}
            >
              {voiceState === 'speaking' ? (
                <Volume2 className="w-10 h-10 text-white animate-bounce" />
              ) : voiceState === 'connecting' ? (
                <RefreshCw className="w-8 h-8 text-white animate-spin" />
              ) : isMuted ? (
                <MicOff className="w-9 h-9 text-white/70" />
              ) : (
                <Radio className="w-9 h-9 text-white" />
              )}
            </div>
          </div>

          {/* Voice State Badge */}
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                voiceState === 'speaking'
                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  : voiceState === 'listening'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : voiceState === 'connecting'
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {voiceState === 'speaking'
                ? 'Copilot Speaking'
                : voiceState === 'listening'
                ? isMuted
                  ? 'Mic Muted'
                  : 'Listening... (Speak anytime)'
                : voiceState === 'connecting'
                ? 'Establishing Live Link...'
                : 'Offline'}
            </span>
          </div>

          {/* Quick Prompts Carousel */}
          <div className="mt-4 w-full flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 whitespace-nowrap pl-1">
              Quick Ops:
            </span>
            <button
              type="button"
              onClick={() => handleQuickPrompt('Explain how a Caesar cipher shift 3 works')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 whitespace-nowrap active:scale-95 transition-all"
            >
              Explain shift 3
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrompt('What is ROT13 and why is it self-inverting?')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 whitespace-nowrap active:scale-95 transition-all"
            >
              What is ROT13?
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrompt('Give me a military tactical message example for encryption testing')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 whitespace-nowrap active:scale-95 transition-all"
            >
              Tactical dispatch example
            </button>
            <button
              type="button"
              onClick={() => handleQuickPrompt('How can brute force crack all 25 Caesar cipher keys?')}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 whitespace-nowrap active:scale-95 transition-all"
            >
              How to brute-force
            </button>
          </div>
        </div>

        {/* Live Conversation Transcript Feed */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-neutral-50/40 dark:bg-neutral-950/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs rounded-tl-xs'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <span className="text-[10px] opacity-60 mt-1 block text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center shrink-0 mt-0.5">
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

        {/* Bottom Control / Text Input Fallback Bar */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <form onSubmit={handleSendText} className="flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Speak aloud or type tactical inquiry..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <PhoneOff className="w-3.5 h-3.5 text-red-500" />
              <span className="hidden sm:inline">End Session</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
