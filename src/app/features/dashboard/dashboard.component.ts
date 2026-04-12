import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppStore } from '../../core/store/app.store';
import { LoanStore } from '../loans/store/loan.store';
import { PaymentStore } from '../payments/store/payment.store';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="flex flex-col gap-6">
      
      <!-- Greeting and Network status -->
      <header class="pt-2">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Hola, {{ appStore.user()?.displayName || 'Invitado' }}
        </h2>
        <div class="flex items-center gap-2 mt-1">
          <span class="relative flex h-2.5 w-2.5">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  [ngClass]="appStore.networkStatus() === 'online' ? 'bg-emerald-400' : 'bg-amber-400'"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5"
                  [ngClass]="appStore.networkStatus() === 'online' ? 'bg-emerald-500' : 'bg-amber-500'"></span>
          </span>
          <span class="text-xs font-medium text-slate-500 dark:text-slate-400">
            {{ appStore.networkStatus() === 'online' ? 'En línea' : 'Modo Sin Conexión' }}
            @if (appStore.syncQueueLength() > 0) {
              <span> ({{ appStore.syncQueueLength() }} pend.)</span>
            }
          </span>
        </div>
      </header>

      <!-- Main Summary Cards -->
      <section class="grid grid-cols-2 gap-4">
        <!-- Total Préstamos -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
          <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            <span class="text-xs font-medium">Activos</span>
          </div>
          <p class="text-2xl font-bold text-slate-800 dark:text-white">{{ activeLoansCount() }}</p>
        </div>

        <!-- Total Pendiente -->
        <div class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 shadow-lg shadow-emerald-500/20 text-white">
          <div class="flex items-center gap-2 text-emerald-100 mb-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span class="text-xs font-medium">Por cobrar</span>
          </div>
          <p class="text-xl font-bold">{{ totalPending() | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
        </div>
      </section>

      <!-- Alertas de Mora -->
      @if (lateLoans().length > 0) {
        <section>
          <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            Alertas de Atraso
          </h3>
          <div class="flex flex-col gap-3">
            @for (loan of lateLoans(); track loan.id) {
              <div class="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl p-3 flex justify-between items-center" [routerLink]="['/loans', loan.id]">
                <div>
                  <p class="font-medium text-rose-900 dark:text-rose-400 text-sm">{{ loan.borrowerName }}</p>
                  <p class="text-xs text-rose-600 dark:text-rose-500/70">Mora detectada</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-rose-700 dark:text-rose-400">{{ loan.installmentValue | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
                  <svg class="w-4 h-4 inline text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- Próximos Pagos -->
      <section>
        <div class="flex justify-between items-end mb-3">
          <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200">Próximos cobros</h3>
          <a routerLink="/loans" class="text-xs font-medium text-emerald-600 dark:text-emerald-400">Ver todos</a>
        </div>
        
        <div class="flex flex-col gap-3">
          @for (loan of upcomingLoans(); track loan.id) {
            <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 flex justify-between items-center active:scale-95 transition-transform" [routerLink]="['/loans', loan.id]">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                  {{ loan.borrowerName.charAt(0) | uppercase }}
                </div>
                <div>
                  <p class="font-medium text-slate-900 dark:text-white text-sm">{{ loan.borrowerName }}</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Cuota: {{ loan.nextDueDate | date:'MMM d' }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-bold text-slate-700 dark:text-slate-200">{{ loan.installmentValue | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
              </div>
            </div>
          }
          
          <!-- Empty state -->
           @if (upcomingLoans().length === 0) {
             <div class="text-center py-8">
               <p class="text-slate-400 text-sm">No hay cobros pendientes recientes.</p>
             </div>
           }
        </div>
      </section>

      <!-- Action FAB -->
      <div class="fixed bottom-20 right-4 z-30">
        <button routerLink="/loans/new" class="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/40 flex items-center justify-center transition-transform active:scale-90">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        </button>
      </div>

    </div>
  `
})
export class DashboardComponent implements OnInit {
  appStore = inject(AppStore);
  loanStore = inject(LoanStore);
  paymentStore = inject(PaymentStore);

  ngOnInit() {
    this.loanStore.loadLoans();
    // Pagos podrían requerir cargar todos o cargarse bajo demanda. 
    // Para totales globales simples, sumamos basandonos en los prestamos o necesitamos cargar los pagos globales.
    // Simplificaremos asumiendo que necesitamos calcular el saldo total restando de todos los prestamos
  }

  // Mocks computed for now (since PaymentStore only loads by loanId currently)
  // To optimize, the totalPending could be calculated via the loanStore directly if we maintain a 'balance' field.
  // For now, we approximate based on loan properties.

  activeLoansCount = computed(() => {
    return this.loanStore.loans().filter(l => l.status === 'active' || l.status === 'late').length;
  });

  totalPending = computed(() => {
    return this.loanStore.loans().reduce((acc, loan) => {
      // Approximate balance if we don't have all payments loaded yet. 
      // Ideal architecture: Loan keeps a running balance updated via cloud function or local trigger
      // So we assume loan.totalAmount is the remaining balance, or we calculate it. 
      // For this demo, let's just sum a dummy remaining value or the full installment amount.
      return acc + (loan.totalInstallments * loan.installmentValue);
    }, 0);
  });

  lateLoans = computed(() => {
    return this.loanStore.loans().filter(l => l.status === 'late').slice(0, 3);
  });

  upcomingLoans = computed(() => {
    return this.loanStore.loans()
      .filter(l => l.status === 'active')
      .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
      .slice(0, 5);
  });
}
