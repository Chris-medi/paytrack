import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LoanStore } from './store/loan.store';
import { PaymentStore } from '../payments/store/payment.store';
import { LoanCalculator } from '../../domain/logic/loan-calculator';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule],
  template: `
    @if (loan()) {
      <div class="flex flex-col h-full bg-slate-50 dark:bg-slate-900 pb-20">
      
      <!-- Top header with actions -->
      <header class="flex items-center justify-between p-4 sticky top-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
        <button (click)="goBack()" class="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        
        <span class="px-3 py-1 text-xs font-bold uppercase rounded-full"
              [ngClass]="{
                    'bg-emerald-100 text-emerald-700': currentStatus() === 'active',
                    'bg-rose-100 text-rose-700': currentStatus() === 'late',
                    'bg-slate-200 text-slate-700': currentStatus() === 'paid'
                  }">
          {{ currentStatus() === 'late' ? 'En Mora' : (currentStatus() === 'paid' ? 'Pagado' : 'Activo') }}
        </span>
      </header>

      <!-- Resumen Main Card -->
      <div class="px-4 mb-6 relative">
        <div class="bg-gradient-to-br from-emerald-500 to-teal-700 w-full rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20">
          
          <p class="text-emerald-100 text-sm font-medium tracking-wide mb-1">{{ loan()?.borrowerName }}</p>
          <div class="flex items-end gap-2 mb-6">
            <h1 class="text-4xl font-bold tracking-tight">{{ balance() | currency:'COP':'symbol-narrow':'1.0-0' }}</h1>
            <p class="text-emerald-200 text-sm pb-1 font-medium">Saldo</p>
          </div>

          <div class="flex justify-between items-center border-t border-emerald-400/30 pt-4">
            <div>
              <p class="text-[10px] text-emerald-200 uppercase tracking-widest font-semibold">Valor Cuota</p>
              <p class="font-semibold">{{ loan()?.installmentValue | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
            </div>
            <div class="text-right">
              <p class="text-[10px] text-emerald-200 uppercase tracking-widest font-semibold">Próximo Pago</p>
              <p class="font-semibold">{{ nextDueDate() | date:'dd MMM yyyy' }}</p>
            </div>
          </div>

        </div>
      </div>

      <!-- Stats Grid -->
      <div class="px-4 grid grid-cols-2 gap-3 mb-6">
        <div class="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-center">
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Progreso</p>
          <p class="text-lg font-bold text-slate-800 dark:text-slate-100">{{ paidInstallments() }} / {{ loan()?.totalInstallments }}</p>
        </div>
        <div class="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-center">
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Abonado</p>
          <p class="text-lg font-bold text-emerald-600 dark:text-emerald-400">{{ totalPaid() | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
        </div>
      </div>

      <!-- Historial de Pagos -->
      <div class="px-4 flex-1">
        <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Historial de Pagos</h3>
        
        <div class="flex flex-col gap-3">
          @if (paymentStore.loading()) {
            <div class="text-center py-4">
              <span class="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full inline-block"></span>
            </div>
          }

          @for (payment of paymentStore.payments(); track payment.id) {
            <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex justify-between items-center">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <div>
                  <p class="text-sm font-semibold text-slate-800 dark:text-white">Pago recibido</p>
                  <p class="text-xs text-slate-500">{{ payment.date | date:'dd MMM yyyy, h:mm a' }}</p>
                </div>
              </div>
              <p class="font-bold text-emerald-600 dark:text-emerald-400">+{{ payment.amount | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
            </div>
          }

          @if (paymentStore.payments().length === 0 && !paymentStore.loading()) {
            <div class="text-center py-8 opacity-50">
              <p class="text-sm">Aún no hay pagos registrados.</p>
            </div>
          }
        </div>
      </div>

      <!-- Modals and Overlays -->
      <!-- Add Payment Modal -->
      @if (isPaymentModalOpen()) {
        <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div class="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in slide-in-from-bottom flex flex-col gap-4">
            <button (click)="isPaymentModalOpen.set(false)" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <h2 class="text-xl font-bold dark:text-white mb-2">Registrar Pago</h2>
            
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Monto del abono</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-3 flex items-center font-bold text-slate-400">$</span>
                <input type="number" [ngModel]="paymentAmount()" (ngModelChange)="paymentAmount.set($event)" 
                       class="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500 text-lg font-semibold dark:text-white">
              </div>
            </div>
            
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase mb-1">Notas (Opcional)</label>
              <textarea [ngModel]="paymentNote()" (ngModelChange)="paymentNote.set($event)" rows="2" 
                        class="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500 dark:text-white text-sm"></textarea>
            </div>

            <button (click)="submitPayment()" class="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-xl mt-2 active:scale-95 transition-transform" [disabled]="!paymentAmount()">
              Confirmar Pago
            </button>
          </div>
        </div>
      }

      <!-- Action FAB (Añadir Pago) -->
      @if (currentStatus() !== 'paid') {
        <button (click)="openPaymentModal()"
                class="fixed bottom-19 right-6 lg:bottom-19 lg:right-1/3 bg-slate-900 dark:bg-emerald-500 text-white rounded-full p-4 shadow-xl shadow-slate-900/20 dark:shadow-emerald-500/20 active:scale-90 transition-transform z-20 flex items-center gap-2 pr-6">
          <svg class="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          <span class="font-bold">Abonar</span>
        </button>
      }

    </div>
    }
  `
})
export class LoanDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  location = inject(Location);
  loanStore = inject(LoanStore);
  paymentStore = inject(PaymentStore);

  loanId: string | null = null;

  // UI States
  isPaymentModalOpen = signal(false);
  paymentAmount = signal<number | null>(null);
  paymentNote = signal('');

  ngOnInit() {
    this.loanId = this.route.snapshot.paramMap.get('id');
    if (!this.loanStore.loans().length) {
      this.loanStore.loadLoans(); // Ensure data is present via refresh
    }
    if (this.loanId) {
      this.paymentStore.loadPayments(this.loanId);
    }
  }

  // Computed Values based on Signals
  loan = computed(() => {
    return this.loanStore.loans().find(l => l.id === this.loanId) || null;
  });

  payments = computed(() => this.paymentStore.payments());

  totalPaid = computed(() => {
    return LoanCalculator.calculateTotalPaid(this.payments());
  });

  balance = computed(() => {
    const l = this.loan();
    if (!l) return 0;
    return LoanCalculator.calculateRemainingBalance(l, this.payments());
  });

  paidInstallments = computed(() => {
    const l = this.loan();
    if (!l) return 0;
    return LoanCalculator.calculatePaidInstallments(l, this.payments());
  });

  nextDueDate = computed(() => {
    const l = this.loan();
    if (!l) return new Date();
    return LoanCalculator.getNextDueDate(l, this.payments());
  });

  currentStatus = computed(() => {
    const l = this.loan();
    if (!l) return 'active';
    return LoanCalculator.determineStatus(l, this.payments());
  });

  goBack() {
    this.location.back();
  }

  openPaymentModal() {
    if (this.loan()) {
      // Suggest installment value
      this.paymentAmount.set(this.loan()!.installmentValue);
    }
    this.isPaymentModalOpen.set(true);
  }

  async submitPayment() {
    const currentLoan = this.loan();
    if (!this.loanId || !this.paymentAmount() || !currentLoan) return;

    const amount = Number(this.paymentAmount());
    if (amount <= 0) return;

    const newPayment = {
      loanId: this.loanId,
      amount: amount,
      date: new Date(),
      note: this.paymentNote()
    };

    // Registrar el pago
    await this.paymentStore.addPayment(newPayment);

    // Calcular y actualizar la próxima fecha de pago en el préstamo
    const updatedPayments = [...this.payments()];
    const newNextDueDate = LoanCalculator.getNextDueDate(currentLoan, updatedPayments);

    const updatedLoan = {
      ...currentLoan,
      nextDueDate: newNextDueDate,
      status: LoanCalculator.determineStatus(currentLoan, updatedPayments)
    };

    await this.loanStore.updateLoan(updatedLoan);

    this.isPaymentModalOpen.set(false);
    this.paymentAmount.set(null);
    this.paymentNote.set('');
  }
}
