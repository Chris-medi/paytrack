import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface VoiceParams {
  nombre: string;
  accion: string;
  monto: string;
}

@Injectable({
  providedIn: 'root'
})
export class AudioAnalysisService {
  private http = inject(HttpClient);
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private readonly API_URL = 'http://localhost:3000/analyze-audio';

  async startRecording() {
    this.audioChunks = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject('No media recorder found');
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        resolve(audioBlob);

        // Stop all tracks to release the microphone
        this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.stop();
    });
  }

  analyzeAudio(audioBlob: Blob, params: VoiceParams) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('nombre', params.nombre);
    formData.append('accion', params.accion);
    formData.append('monto', params.monto);

    return this.http.post<VoiceParams>(this.API_URL, formData);
  }
}
