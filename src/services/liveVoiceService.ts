/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CryptoActionResult {
  operation: 'ENCRYPT' | 'DECRYPT' | 'BRUTE_FORCE' | 'SET_SHIFT' | 'NAVIGATE' | 'VAULT_SAVED' | 'RADIO_BROADCAST';
  plaintext?: string;
  ciphertext?: string;
  shift?: number;
  formula?: string;
  page?: string;
  id?: string;
  frequency?: string;
  topCandidate?: { shift: number; candidatePlaintext: string; score: number; isRot13?: boolean };
  topCandidates?: Array<{ shift: number; candidatePlaintext: string; score: number; isRot13?: boolean }>;
  notes?: string;
}

export interface LiveVoiceMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  cryptoResult?: CryptoActionResult;
}

export type LiveVoiceState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'error';

export interface LiveVoiceCallbacks {
  onStateChange: (state: LiveVoiceState) => void;
  onMessage: (message: LiveVoiceMessage) => void;
  onVolumeChange?: (inputVol: number, outputVol: number) => void;
  onError: (errorMessage: string) => void;
  onCryptoAction?: (action: string, result: CryptoActionResult) => void;
}

export class LiveVoiceClient {
  private ws: WebSocket | null = null;
  private micStream: MediaStream | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private isMuted = false;
  private state: LiveVoiceState = 'idle';
  private callbacks: LiveVoiceCallbacks;

  private nextPlaybackTime = 0;
  private activeAudioSources: AudioBufferSourceNode[] = [];
  private currentAssistantTurnText = '';

  constructor(callbacks: LiveVoiceCallbacks) {
    this.callbacks = callbacks;
  }

  getState(): LiveVoiceState {
    return this.state;
  }

  private setState(newState: LiveVoiceState) {
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  async connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setState('connecting');

    try {
      // 1. Request Microphone access first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser.');
      }

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 2. Initialize 24kHz Output AudioContext for Gemini Live output
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.outputAudioContext = new AudioContextClass({ sampleRate: 24000 });
      if (this.outputAudioContext.state === 'suspended') {
        await this.outputAudioContext.resume();
      }

      // 3. Connect to server-side WebSocket bridge
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setupMicCapture();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (err) {
          console.error('[LiveVoice Client] Parse error:', err);
        }
      };

      this.ws.onerror = (e) => {
        console.error('[LiveVoice Client] WebSocket error:', e);
        this.setState('error');
        this.callbacks.onError('WebSocket connection to Live API failed. Ensure server is active.');
      };

      this.ws.onclose = () => {
        if (this.state !== 'error') {
          this.setState('idle');
        }
        this.cleanupAudio();
      };
    } catch (err: any) {
      console.error('[LiveVoice Client] Connect failure:', err);
      this.setState('error');
      this.callbacks.onError(err?.message || 'Failed to connect to Live Voice service.');
      this.disconnect();
    }
  }

  private setupMicCapture() {
    if (!this.micStream) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      // Setup input context at 16,000Hz as mandated by Gemini Live API
      this.inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
      const source = this.inputAudioContext.createMediaStreamSource(this.micStream);

      // Buffer size 2048 gives low latency (~128ms per chunk)
      this.scriptProcessor = this.inputAudioContext.createScriptProcessor(2048, 1, 1);

      this.scriptProcessor.onaudioprocess = (e) => {
        if (this.isMuted || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const inputChannel = e.inputBuffer.getChannelData(0);

        // Calculate input volume for visualizer
        let sumSquares = 0;
        for (let i = 0; i < inputChannel.length; i++) {
          sumSquares += inputChannel[i] * inputChannel[i];
        }
        const rms = Math.sqrt(sumSquares / inputChannel.length);
        if (this.callbacks.onVolumeChange) {
          this.callbacks.onVolumeChange(Math.min(1, rms * 5), 0);
        }

        // Convert Float32Array to 16-bit PCM little-endian
        const pcm16 = new Int16Array(inputChannel.length);
        for (let i = 0; i < inputChannel.length; i++) {
          const s = Math.max(-1, Math.min(1, inputChannel[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Base64 encode PCM buffer
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = btoa(binary);

        this.ws.send(JSON.stringify({
          type: 'audio_chunk',
          audio: base64Audio,
        }));
      };

      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.inputAudioContext.destination);

      this.setState('listening');
    } catch (err) {
      console.error('[LiveVoice Client] Audio capture setup error:', err);
    }
  }

  private handleServerMessage(data: any) {
    if (data.type === 'session_ready') {
      this.setState('listening');
    } else if (data.type === 'crypto_action') {
      if (this.callbacks.onCryptoAction) {
        this.callbacks.onCryptoAction(data.action, data.result);
      }
    } else if (data.type === 'server_chunk') {
      if (data.interrupted) {
        this.stopActivePlayback();
        this.setState('listening');
        return;
      }

      if (data.text) {
        this.currentAssistantTurnText += data.text;
      }

      if (data.audio) {
        this.setState('speaking');
        this.playPcm24kAudio(data.audio);
      }

      if (data.turnComplete) {
        if (this.currentAssistantTurnText.trim()) {
          this.callbacks.onMessage({
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            sender: 'assistant',
            text: this.currentAssistantTurnText.trim(),
            timestamp: Date.now(),
          });
          this.currentAssistantTurnText = '';
        }
        this.setState('listening');
      }
    } else if (data.type === 'error') {
      this.setState('error');
      this.callbacks.onError(data.error || 'Live Copilot server error');
    }
  }

  private playPcm24kAudio(base64Data: string) {
    if (!this.outputAudioContext) return;

    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = this.outputAudioContext.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioContext.destination);

      const currentTime = this.outputAudioContext.currentTime;
      const startTime = Math.max(currentTime, this.nextPlaybackTime);
      source.start(startTime);
      this.nextPlaybackTime = startTime + audioBuffer.duration;

      this.activeAudioSources.push(source);
      source.onended = () => {
        const idx = this.activeAudioSources.indexOf(source);
        if (idx !== -1) {
          this.activeAudioSources.splice(idx, 1);
        }
        if (this.activeAudioSources.length === 0 && this.state === 'speaking') {
          this.setState('listening');
        }
      };
    } catch (err) {
      console.error('[LiveVoice Client] Playback decode error:', err);
    }
  }

  private stopActivePlayback() {
    for (const source of this.activeAudioSources) {
      try {
        source.stop();
      } catch {}
    }
    this.activeAudioSources = [];
    if (this.outputAudioContext) {
      this.nextPlaybackTime = this.outputAudioContext.currentTime;
    }
    this.currentAssistantTurnText = '';
  }

  sendTextMessage(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.callbacks.onMessage({
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    });

    this.ws.send(JSON.stringify({
      type: 'text_input',
      text,
    }));
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  disconnect() {
    this.stopActivePlayback();
    this.cleanupAudio();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setState('idle');
  }

  private cleanupAudio() {
    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.disconnect();
      } catch {}
      this.scriptProcessor = null;
    }

    if (this.inputAudioContext) {
      try {
        this.inputAudioContext.close();
      } catch {}
      this.inputAudioContext = null;
    }

    if (this.outputAudioContext) {
      try {
        this.outputAudioContext.close();
      } catch {}
      this.outputAudioContext = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
  }
}
