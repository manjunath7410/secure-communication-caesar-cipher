/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TranscriptionResult {
  text: string;
  model: string;
  timestamp: number;
}

export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async startRecording(): Promise<void> {
    this.audioChunks = [];
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Microphone access is not supported in this browser or environment.');
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Detect supported MIME type
    let mimeType = 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
      mimeType = 'audio/ogg;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/wav')) {
      mimeType = 'audio/wav';
    }

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(250); // Collect every 250ms
  }

  async stopRecording(): Promise<{ blob: Blob; mimeType: string; base64: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recorder session'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });

          // Clean up stream tracks
          if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
          }

          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = (reader.result as string).split(',')[1] || '';
            resolve({
              blob: audioBlob,
              mimeType,
              base64: base64Data,
            });
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(audioBlob);
        } catch (err) {
          reject(err);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.audioChunks = [];
  }
}

/**
 * Transcribe recorded audio with server-side gemini-3.5-transcribe
 */
export async function transcribeAudio(
  base64Audio: string,
  mimeType = 'audio/webm'
): Promise<TranscriptionResult> {
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio: base64Audio,
      mimeType,
    }),
  });

  if (!response.ok) {
    let errorDetail = 'Audio transcription failed.';
    try {
      const errJson = await response.json();
      if (errJson.error) errorDetail = errJson.error;
    } catch {}
    throw new Error(errorDetail);
  }

  const data = await response.json();
  return {
    text: data.text || '',
    model: data.model || 'gemini-3.5-transcribe',
    timestamp: data.timestamp || Date.now(),
  };
}
