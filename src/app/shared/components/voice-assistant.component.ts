import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AudioAnalysisService, VoiceParams } from '../../core/services/audio-analysis.service';
import { LoanStore } from '../../features/loans/store/loan.store';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-voice-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed bottom-20 left-4 z-1 flex flex-col items-start gap-3">
      
      <!-- Status Toast -->
      @if (statusMessage() && !isAnalyzing()) {
        <div 
          [class]="isSuccess() ? 'bg-emerald-500/90 border-emerald-400/50' : 'bg-rose-500/90 border-rose-400/50'"
          class="mb-2 px-4 py-2 rounded-2xl text-white shadow-xl backdrop-blur-md border flex items-center gap-3 animate-in slide-in-from-left duration-300">
          @if (isSuccess()) {
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          } @else {
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          }
          <span class="text-sm font-medium tracking-tight truncate max-w-[200px]">{{ statusMessage() }}</span>
          <button (click)="statusMessage.set('')" class="hover:bg-white/10 rounded-full p-1 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      }

      <!-- Botón Flotante (Micrófono) -->
      <button 
        (click)="isRecording() ? stopAndSend() : startRecording()"
        [class.bg-emerald-500]="!isRecording() && !isAnalyzing()"
        [class.bg-rose-500]="isRecording()"
        [class.bg-amber-500]="isAnalyzing()"
        [class.animate-pulse]="isRecording()"
        [disabled]="isAnalyzing()"
        class="w-14 h-14 rounded-full shadow-lg shadow-emerald-500/20 flex items-center justify-center text-white transition-all transform active:scale-90 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed">
        
        @if (isRecording()) {
          <div class="relative flex items-center justify-center">
             <div class="absolute w-12 h-12 bg-rose-400/30 rounded-full animate-ping"></div>
             <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z" /></svg>
          </div>
        } @else if (isAnalyzing()) {
          <svg class="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        } @else {
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
        }
      </button>

      <!-- Loader Overlay Centrado -->
      @if (isAnalyzing()) {
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center animate-in fade-in duration-300">
          <div class="bg-white/20 p-8 rounded-[2rem] border border-white/30 shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
            <div class="relative">
              <div class="w-16 h-16 border-4 border-emerald-500/20 rounded-full"></div>
              <div class="absolute inset-0 w-16 h-16 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <div class="text-center">
              <p class="text-white text-xl font-bold tracking-tight">Analizando voz</p>
              <p class="text-white/70 text-sm mt-1">Espera un momento...</p>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-ping { animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; }
    @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
    
    .animate-in { animation-duration: 300ms; animation-fill-mode: both; }
    .fade-in { animation-name: fadeIn; }
    .zoom-in-95 { animation-name: zoomIn95; }
    .slide-in-from-left { animation-name: slideInLeft; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes zoomIn95 { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    @keyframes slideInLeft { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  `]
})
export class VoiceAssistantComponent {
  private audioService = inject(AudioAnalysisService);
  private router = inject(Router);
  private loanStore = inject(LoanStore);

  isRecording = signal(false);
  isAnalyzing = signal(false);
  statusMessage = signal('');
  isSuccess = signal(true);

  params = signal<VoiceParams>({
    nombre: '',
    accion: 'Crear | Buscar | Pagar: "abonar capital a un prestamo"| Morosos ',
    monto: '',
  });

  async startRecording() {
    try {
      await this.audioService.startRecording();
      this.isRecording.set(true);
      this.statusMessage.set('Grabando audio...');
      this.isSuccess.set(true);
    } catch (error) {
      this.statusMessage.set('Error al acceder al micrófono');
      this.isSuccess.set(false);
    }
  }

  async stopAndSend() {
    this.isRecording.set(false);
    this.isAnalyzing.set(true);
    this.statusMessage.set('Analizando audio...');

    const audioBlob = await this.audioService.stopRecording();
    this.audioService.analyzeAudio(audioBlob, this.params()).pipe(
      finalize(() => {
        this.isAnalyzing.set(false);
        if (this.isSuccess()) {
          setTimeout(() => this.statusMessage.set(''), 5000);
        }
      })
    ).subscribe({
      next: (result: VoiceParams) => {
        this.params.set(result);
        this.statusMessage.set(`Entendido: ${result.accion} para ${result.nombre}`);
        this.isSuccess.set(true);
        this.handleVoiceAction(result);
      },
      error: (err: any) => {
        console.error('Error analizando audio:', err);
        this.statusMessage.set('Error en el análisis del audio');
        this.isSuccess.set(false);
      }
    })
  }

  handleVoiceAction(result: VoiceParams) {
    const accion = (result.accion || '').toLowerCase();
    const nombre = result.nombre || '';
    const monto = result.monto || '';

    if (accion.includes('crear')) {
      this.router.navigate(['/loans/new']);
    } else if (accion.includes('buscar') || accion.includes('pagar')) {
      // Find loan ID for the given name
      const loan = this.loanStore.loans().find(l =>
        l.borrowerName.toLowerCase().includes(nombre.toLowerCase())
      );

      if (loan) {
        this.router.navigate(['/loans', loan.id], { queryParams: { amount: monto } });
      } else {
        // Fallback to search
        this.router.navigate(['/loans'], { queryParams: { search: nombre } });
      }
    } else if (accion.includes('moro')) {
      this.router.navigate(['/loans'], { queryParams: { status: 'late' } });
    }
  }
}
