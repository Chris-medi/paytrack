import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 pb-16">
      <!-- Navbar superior (opcional o específica de pantalla) -->
      <header class="sticky top-0 z-10 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 shadow-sm px-4 py-3 flex justify-between items-center">
        <h1 class="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">PayTrack</h1>
        <!-- Podría ir foto de perfil o botón de config aquí -->
      </header>

      <!-- Contenido Principal -->
      <main class="flex-1 p-4 w-full max-w-md mx-auto">
        <router-outlet></router-outlet>
      </main>

      <!-- Bottom Navigation Bar (Mobile First) -->
      <nav class="fixed bottom-0 w-full bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 pb-safe pb-2 z-20">
        <div class="flex justify-around items-center h-14 max-w-md mx-auto">
          
          <a routerLink="/dashboard" routerLinkActive="text-emerald-600 dark:text-emerald-400" 
             [routerLinkActiveOptions]="{exact: true}"
             class="flex flex-col items-center justify-center w-full h-full hover:text-emerald-500 transition-colors">
            <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span class="text-[10px] font-medium">Inicio</span>
          </a>

          <a routerLink="/loans" routerLinkActive="text-emerald-600 dark:text-emerald-400"
             class="flex flex-col items-center justify-center w-full h-full hover:text-emerald-500 transition-colors">
            <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span class="text-[10px] font-medium">Préstamos</span>
          </a>

          <a routerLink="/borrowers" routerLinkActive="text-emerald-600 dark:text-emerald-400"
             class="flex flex-col items-center justify-center w-full h-full hover:text-emerald-500 transition-colors">
            <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <span class="text-[10px] font-medium">Clientes</span>
          </a>

        </div>
      </nav>
    </div>
  `
})
export class MainLayoutComponent { }
