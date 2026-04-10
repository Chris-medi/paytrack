import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../../core/firebase/firebase.service';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-50 px-6">
      
      <!-- Decorative background blur -->
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>

      <div class="relative z-10 w-full max-w-sm flex flex-col items-center">
        <!-- Logo Icon -->
        <div class="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        
        <h1 class="text-3xl font-bold mb-2">PayTrack</h1>
        <p class="text-slate-400 text-center mb-10 text-sm">Gestiona tus préstamos y cobros de manera profesional desde tu móvil.</p>

        <button 
          (click)="loginWithGoogle()"
          class="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-semibold py-3.5 px-4 rounded-xl hover:bg-slate-100 active:scale-95 transition-all shadow-md">
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Entrar con Google
        </button>

        <!-- Debug offline bypass -->
        <button 
          (click)="bypassLogin()"
          class="mt-6 text-xs text-slate-500 underline">
          Modo Offline (Dev Bypass)
        </button>
      </div>
    </div>
  `
})
export class LoginComponent {
  #router = inject(Router);
  #firebaseService = inject(FirebaseService);

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(this.#firebaseService.auth, provider);
      this.#router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Error logging in:', error);
      // alert('Error al iniciar sesión');
    }
  }

  bypassLogin() {
    this.#router.navigate(['/dashboard']);
  }
}
