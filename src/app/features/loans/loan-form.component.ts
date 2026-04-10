import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoanStore } from './store/loan.store';
import { loanSchema } from '../../domain/schemas/loan.schema';
import { Loan } from '../../domain/models/loan.model';

@Component({
  selector: 'app-loan-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div class="flex flex-col gap-4 pb-20">
      
      <header class="flex items-center gap-3 pt-2 mb-4">
        <button (click)="goBack()" class="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 text-slate-500 hover:text-emerald-500">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">Nuevo Préstamo</h2>
      </header>

      <!-- Formulario -->
      <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-4">
        
        <!-- Cliente -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Nombre del Cliente</label>
          <input type="text" [ngModel]="formData().borrowerName" (ngModelChange)="updateField('borrowerName', $event)" 
                 class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none">
          <p class="text-rose-500 text-xs mt-1 min-h-[16px]">{{ errors()['borrowerName'] }}</p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Documento (CC)</label>
          <input type="number" [ngModel]="formData().borrowerDocument" (ngModelChange)="updateField('borrowerDocument', $event)" 
                 class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none">
          <p class="text-rose-500 text-xs mt-1 min-h-[16px]">{{ errors()['borrowerDocument'] }}</p>
        </div>

        <hr class="border-slate-100 dark:border-slate-700 my-2">

        <!-- Montos -->
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Capital a Prestar</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 font-bold">$</span>
              <input type="number" [ngModel]="formData().totalAmount" (ngModelChange)="updateField('totalAmount', $event, true)" 
                     class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none">
            </div>
            <p class="text-rose-500 text-xs mt-1 min-h-[16px]">{{ errors()['totalAmount'] }}</p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Interés % <span class="lowercase text-[10px]">(mensual)</span></label>
            <input type="number" [ngModel]="formData().monthlyInterest" (ngModelChange)="updateField('monthlyInterest', $event, true)" 
                   class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none">
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Total Cuotas <span class="lowercase text-[10px]">(meses)</span></label>
            <input type="number" [ngModel]="formData().totalInstallments" (ngModelChange)="updateField('totalInstallments', $event, true)" 
                   class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" min="1">
          </div>
        </div>

        <hr class="border-slate-100 dark:border-slate-700 my-2">

        <!-- Fechas -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Primera Fecha de Pago</label>
          <input type="date" [ngModel]="formData().firstDueDate" (ngModelChange)="updateField('firstDueDate', $event)" 
                 class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none">
          <p class="text-rose-500 text-xs mt-1 min-h-[16px]">{{ errors()['firstDueDate'] }}</p>
        </div>

      </div>

      <!-- Preview del Cálculo -->
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden">
        
        <div class="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20"></div>
        
        <h3 class="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
          Resumen Calculado
        </h3>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-[10px] text-slate-400 uppercase">Valor de la Cuota</p>
            <p class="text-xl font-bold">{{ calculatedValorCuota() | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
          </div>
          <div class="text-right">
            <p class="text-[10px] text-slate-400 uppercase">Total a Pagar</p>
            <p class="text-lg font-semibold text-emerald-300">{{ calculatedTotal() | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
          </div>
        </div>

      </div>

      <button 
        (click)="submit()"
        [disabled]="loanStore.loading() || !isValid()"
        class="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2 mt-2">
        @if (loanStore.loading()) {
          <span class="animate-spin w-5 h-5 border-2 border-white rounded-full border-t-transparent"></span>
        }
        {{ loanStore.loading() ? 'Guardando...' : 'Crear Préstamo' }}
      </button>

    </div>
  `
})
export class LoanFormComponent {
  loanStore = inject(LoanStore);
  router = inject(Router);
  location = inject(Location);

  // Initial State form (Signals)
  formData = signal<any>({
    borrowerName: '',
    borrowerDocument: '',
    totalAmount: null,
    monthlyInterest: 5,
    totalInstallments: 1,
    firstDueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0] // por default dejar para el proximo mes
  });

  errors = signal<Record<string, string>>({});

  // Calculations
  calculatedTotal = computed(() => {
    const data = this.formData();
    const amount = Number(data.totalAmount) || 0;
    const interest = Number(data.monthlyInterest) || 0;
    const months = Number(data.totalInstallments) || 1;

    // Simple Interest P + (P * r * t)
    const interesAmount = (amount * (interest / 100)) * months;
    return amount + interesAmount;
  });

  calculatedValorCuota = computed(() => {
    const months = Number(this.formData().totalInstallments) || 1;
    return this.calculatedTotal() / months;
  });

  isValid = computed(() => {
    return Object.keys(this.errors()).length === 0 && this.formData().totalAmount > 0 && this.formData().borrowerName.length >= 3;
  });

  updateField(field: string, value: string | number, isNumber = false) {
    const current = this.formData();
    const val = isNumber ? Number(value) : value;
    this.formData.set({ ...current, [field]: val });
    this.validateForm();
  }

  validateForm() {
    const data = this.formData();

    // Preparar payload para zod validation (transforming strings to Dates)
    const payloadToValidate = {
      ...data,
      borrowerDocument: String(data.borrowerDocument), // Enforce string for document
      startDate: new Date(),
      firstDueDate: new Date(data.firstDueDate + 'T00:00:00'),
      installmentValue: this.calculatedValorCuota()
    };

    const result = loanSchema.safeParse(payloadToValidate);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        fieldErrors[String(issue.path[0])] = issue.message;
      });
      this.errors.set(fieldErrors);
    } else {
      this.errors.set({});
    }
  }

  async submit() {
    this.validateForm();
    if (!this.isValid()) return;

    const data = this.formData();

    const newLoan: Loan = {
      borrowerName: data.borrowerName,
      borrowerDocument: String(data.borrowerDocument),
      totalAmount: this.calculatedTotal(), // saving the expected total return directly. Depending on financial model, it could be the nominal principal amount.
      monthlyInterest: data.monthlyInterest,
      annualInterest: data.monthlyInterest * 12,
      totalInstallments: data.totalInstallments,
      installmentValue: this.calculatedValorCuota(),
      startDate: new Date(),
      firstDueDate: new Date(data.firstDueDate + 'T00:00:00'),
      nextDueDate: new Date(data.firstDueDate + 'T00:00:00'),
      status: 'active',
      createdAt: new Date()
    };

    await this.loanStore.addLoan(newLoan);
    this.router.navigate(['/loans']);
  }

  goBack() {
    this.location.back();
  }
}
