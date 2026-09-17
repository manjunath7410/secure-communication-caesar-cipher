/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Sparkles,
  Check,
  Copy,
  X,
  RefreshCw,
  ArrowRight,
  Radio,
} from 'lucide-react';
import { AudioRecorderService, transcribeAudio } from '../../services/transcriptionService';
import { copyToClipboard } from '../../utils/clipboard';

interface AudioTranscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertText?: (text: string) => void;
  targetFieldLabel?: string;
  defaultMode?: 'encrypt' | 'decrypt' | 'general';
}

export const AudioTranscribeModal: React.FC<AudioTranscribeModalProps> = ({
  isOpen,
  onClose,
  onInsertText,
  targetFieldLabel = 'Message Field',
  defaultMode = 'general',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recorderRef = useRef<AudioRecorderService | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      handleCancel();
    }
  }, [isOpen]);

  const startRecording = async () => {
    setErrorMessage(null);
    setTranscribedText('');
    setElapsedSeconds(0);

    try {
      if (!recorderRef.current) {
        recorderRef.current = new AudioRecorderService();
      }
      await recorderRef.current.startRecording();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not access microphone.');
      setIsRecording(false);
    }
  };

  const stopRecordingAndTranscribe = async () => {
    if (!recorderRef.current || !isRecording) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      const { base64, mimeType } = await recorderRef.current.stopRecording();
      const result = await transcribeAudio(base64, mimeType);
      setTranscribedText(result.text);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to transcribe audio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCancel = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current) {
      recorderRef.current.cancelRecording();
    }
    setIsRecording(false);
    setIsTranscribing(false);
    setElapsedSeconds(0);
    setErrorMessage(null);
  };

  const handleCopy = async () => {
    if (!transcribedText) return;
    const ok = await copyToClipboard(transcribedText);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInsert = () => {
    if (!transcribedText) return;
    onInsertText?.(transcribedText);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="audio-transcribe-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-[28px] sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                Voice Dictation & Transcription
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  gemini-3.5-transcribe
                </span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Speak your message clearly into the microphone
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col items-center justify-center space-y-6">
          {/* Visual Microphone Radar Circle */}
          <div className="relative flex items-center justify-center my-2">
            {isRecording && (
              <>
                <div className="absolute w-32 h-32 rounded-full bg-red-500/20 animate-ping duration-1000" />
                <div className="absolute w-24 h-24 rounded-full bg-red-500/30 animate-pulse" />
              </>
            )}

            {isTranscribing && (
              <div className="absolute w-28 h-28 rounded-full border-2 border-dashed border-blue-500 animate-spin" />
            )}

            <button
              type="button"
              onClick={isRecording ? stopRecordingAndTranscribe : startRecording}
              disabled={isTranscribing}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white transition-all shadow-lg active:scale-95 ${
                isRecording
                  ? 'bg-red-600 shadow-red-500/30 hover:bg-red-700'
                  : isTranscribing
                  ? 'bg-neutral-400 cursor-not-allowed'
                  : 'bg-blue-600 shadow-blue-500/30 hover:bg-blue-700'
              }`}
            >
              {isRecording ? (
                <Square className="w-8 h-8 fill-current" />
              ) : isTranscribing ? (
                <RefreshCw className="w-8 h-8 animate-spin" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          {/* Status Label & Timer */}
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {isRecording
                ? `Recording live audio... ${Math.floor(elapsedSeconds / 60)}:${(elapsedSeconds % 60)
                    .toString()
                    .padStart(2, '0')}`
                : isTranscribing
                ? 'Transcribing audio with gemini-3.5-transcribe...'
                : transcribedText
                ? 'Transcription completed'
                : 'Tap microphone to begin dictating'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {isRecording
                ? 'Tap stop when you have finished speaking'
                : isTranscribing
                ? 'Processing high-fidelity acoustic speech tokens'
                : 'Target: ' + targetFieldLabel}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="w-full p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 text-center">
              {errorMessage}
            </div>
          )}

          {/* Transcribed Output Display */}
          {transcribedText && (
            <div className="w-full bg-neutral-50 dark:bg-neutral-800/60 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700/60 text-left space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span className="font-medium">Transcription Output</span>
                <span className="font-mono text-[11px]">
                  {transcribedText.length} characters
                </span>
              </div>
              <p className="text-sm text-neutral-900 dark:text-neutral-100 font-medium whitespace-pre-wrap select-text leading-relaxed">
                "{transcribedText}"
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-700/40">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-neutral-200/70 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {transcribedText && onInsertText && (
              <button
                type="button"
                onClick={handleInsert}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
              >
                Insert into {targetFieldLabel}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
