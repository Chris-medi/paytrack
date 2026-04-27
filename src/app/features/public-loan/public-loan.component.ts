import { Component, computed, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { LoanCalculator } from '../../domain/logic/loan-calculator';
import { Loan, LoanStatus } from '../../domain/models/loan.model';
import { Payment } from '../../domain/models/payment.model';
import { CartPaidDetailsComponent } from '../../shared/components/cart-paid-details.component';
import { CartPaidHistoryComponent } from '../../shared/components/cart-paid-history.component';

@Component({
  selector: 'app-public-loan',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, CartPaidDetailsComponent, CartPaidHistoryComponent],
  template: `
    <!-- Full screen public view -->
    <div class="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-slate-100">

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex flex-col items-center justify-center min-h-screen gap-4">
          <div class="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-slate-400 text-sm animate-pulse">Cargando información del préstamo...</p>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
          <div class="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
          </div>
          <h2 class="text-lg font-bold text-slate-200">Préstamo no encontrado</h2>
          <p class="text-slate-400 text-sm text-center">El enlace puede estar incorrecto o el préstamo ya no existe.</p>
        </div>
      }

      <!-- Loan Data -->
      @if (loan() && !loading() && !error()) {
        <div class="max-w-md mx-auto px-4 py-6">
          
          <!-- Header with Logo -->
          <header class="flex items-center justify-center gap-3 mb-8">
            <div class="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h1 class="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">PayTrack</h1>
          </header>

          <!-- Status Badge -->
          <div class="flex justify-center mb-6">
            <span class="px-4 py-1.5 text-xs font-bold uppercase rounded-full tracking-wider"
                  [ngClass]="{
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30': currentStatus() === 'active',
                    'bg-rose-500/20 text-rose-400 border border-rose-500/30': currentStatus() === 'late',
                    'bg-slate-700 text-slate-300 border border-slate-600': currentStatus() === 'paid'
                  }">
              {{ currentStatus() === 'late' ? '⚠️ En Mora' : (currentStatus() === 'paid' ? '✅ Pagado' : '🟢 Activo') }}
            </span>
          </div>

          <!-- Borrower Name -->
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-white mb-1">{{ loan()!.borrowerName }}</h2>
            <p class="text-slate-400 text-sm flex items-center justify-center gap-1">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              {{ loan()!.borrowerLocation }}
            </p>
          </div>

          <!-- Balance Card -->
          <div class="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl p-6 text-white shadow-2xl shadow-emerald-500/20 mb-6 relative overflow-hidden">
            <div class="absolute -right-12 -top-12 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            
            <p class="text-emerald-100 text-xs uppercase tracking-widest font-semibold mb-2">Deuda Total Pendiente</p>
            <h3 class="text-4xl font-bold tracking-tight mb-2">{{ balance() | currency:'COP':'symbol-narrow':'1.2-2' }}</h3>
            
            <div class="flex items-end gap-2 opacity-80 mb-4">
              <h4 class="text-xl font-semibold tracking-tight">{{ capitalBalance() | currency:'COP':'symbol-narrow':'1.2-2' }}</h4>
              <p class="text-emerald-200 text-xs pb-0.5 font-medium">Saldo Capital</p>
            </div>
            
            <div class="flex justify-between items-center border-t border-emerald-400/30 pt-4">
              <div>
                <p class="text-[10px] text-emerald-200 uppercase tracking-widest font-semibold">Valor Cuota</p>
                <p class="font-semibold text-lg">{{ loan()!.installmentValue | currency:'COP':'symbol-narrow':'1.2-2' }}</p>
              </div>
              <div class="text-right">
                <p class="text-[10px] text-emerald-200 uppercase tracking-widest font-semibold">Próximo Pago</p>
                <p class="font-semibold text-lg">{{ nextDueDate() | date:'dd MMM yyyy' }}</p>
              </div>
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 text-center">
              <p class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Total Prestado</p>
              <p class="text-lg font-bold text-white">{{ loan()!.principalAmount | currency:'COP':'symbol-narrow':'1.2-2' }}</p>
            </div>
            <div class="bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 text-center">
              <p class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Deuda Total Inicial</p>
              <p class="text-lg font-bold text-slate-300">{{ loan()!.totalAmount | currency:'COP':'symbol-narrow':'1.2-2' }}</p>
            </div>
            <div class="bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 text-center">
              <p class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Capital Pagado</p>
              <p class="text-lg font-bold text-emerald-400">{{ totalCapitalPaid() | currency:'COP':'symbol-narrow':'1.2-2' }}</p>
            </div>
            <div class="bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 text-center">
              <p class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Interés Pagado</p>
              <p class="text-lg font-bold text-emerald-400">{{ totalInterestPaid() | currency:'COP':'symbol-narrow':'1.2-2' }}</p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="mb-8">
            <div class="flex justify-between text-xs text-slate-400 mb-2">
              <span>Progreso de Pagos</span>
              <span>{{ progressPercent() }}%</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700/50">
              <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700 ease-out" 
                   [style.width.%]="progressPercent()"></div>
            </div>
          </div>

          <!-- Tabs for Schedule vs History -->
          <div class="px-4 flex gap-4 mb-4 border-b border-slate-200 dark:border-slate-700 p-2 m-2">
            <button (click)="activeTab.set('schedule')" [class.underline]="activeTab() === 'schedule'" [class.text-emerald-500]="activeTab() === 'schedule'" class="pb-2  text-sm font-bold uppercase tracking-wider border-transparent transition-colors">Cronograma</button>
            <button (click)="activeTab.set('history')" [class.underline]="activeTab() === 'history'" [class.text-emerald-500]="activeTab() === 'history'" class="pb-2 text-sm font-bold uppercase tracking-wider text-slate-500 border-transparent transition-colors">Historial</button>
          </div>

          <!-- Tab Content -->
          <div class="min-h-[300px]">
          
            <!-- Tab: Schedule -->
            @if (activeTab() === 'schedule') {
              <div class="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                @for (year of scheduleYears(); track year) {
                  <button (click)="selectedYear.set(year)" 
                    [ngClass]="year === selectedYear() ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-800 text-slate-300 border border-slate-700'"
                    class="px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap">
                    {{ year }}
                  </button>
                }
              </div>

              <div class="flex flex-col gap-3">
                 @for (inst of currentYearSchedule(); track inst.number) {
                   <app-cart-paid-details [inst]="inst" />
                 }
                 @if (currentYearSchedule().length === 0) {
                   <div class="text-center py-8 text-slate-500 text-sm">
                     No hay cuotas programadas para este año.
                   </div>
                 }
              </div>
            }

            <!-- Tab: History -->
            @if (activeTab() === 'history') {
              <div class="flex flex-col gap-3">
                @for (payment of payments(); track payment.id) {
                  <app-cart-paid-history [payment]="payment" />
                }

                @if (payments().length === 0) {
                  <div class="text-center py-8 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                    <p class="text-sm text-slate-500">Sin pagos registrados aún.</p>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Footer Branding -->
          <footer class="text-center mt-12 mb-6">
            <div class="flex items-center justify-center gap-2 opacity-40">
              <div class="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-lg flex items-center justify-center">
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <span class="text-xs font-medium text-slate-500">Generado por PayTrack</span>
            </div>
          </footer>

        </div>
      }
    </div>
  `
})
export class PublicLoanComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private supabaseService = inject(SupabaseService);

  loan = signal<Loan | null>(null);
  payments = signal<Payment[]>([]);
  loading = signal(true);
  error = signal(false);

  activeTab = signal<'schedule' | 'history'>('schedule');
  selectedYear = signal<number>(new Date().getFullYear());

  constructor() {
    effect(() => {
      const years = this.scheduleYears();
      if (years.length > 0 && !years.includes(this.selectedYear())) {
        const currentY = new Date().getFullYear();
        if (years.includes(currentY)) {
          this.selectedYear.set(currentY);
        } else {
          this.selectedYear.set(years[0]);
        }
      }
    }, { allowSignalWrites: true });
  }

  async ngOnInit() {
    const loanId = this.route.snapshot.paramMap.get('id');
    if (!loanId) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }

    try {
      // Fetch loan directly from Supabase (public RLS policy allows this)
      const { data: loanData, error: loanError } = await this.supabaseService.supabase
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .single();

      if (loanError || !loanData) {
        this.error.set(true);
        this.loading.set(false);
        return;
      }

      this.loan.set({
        id: loanData.id,
        borrowerName: loanData.borrower_name,
        borrowerLocation: loanData.borrower_location,
        borrowerPhone: loanData.borrower_phone,
        principalAmount: Number(loanData.principal_amount || loanData.total_amount),
        totalAmount: Number(loanData.total_amount),
        monthlyInterest: Number(loanData.monthly_interest),
        annualInterest: Number(loanData.annual_interest),
        totalInstallments: Number(loanData.total_installments),
        installmentValue: Number(loanData.installment_value),
        startDate: new Date(loanData.start_date),
        firstDueDate: new Date(loanData.first_due_date),
        nextDueDate: new Date(loanData.next_due_date),
        status: loanData.status as LoanStatus,
        createdAt: new Date(loanData.created_at),
      });

      // Fetch payments for this loan
      const { data: paymentsData, error: paymentsError } = await this.supabaseService.supabase
        .from('payments')
        .select('id, loan_id, user_id, date, amount, interest_amount, capital_amount, note, receipt_url')
        .eq('loan_id', loanId)
        .order('date', { ascending: false });

      if (!paymentsError && paymentsData) {
        this.payments.set(paymentsData.map(p => ({
          id: p.id,
          loanId: p.loan_id,
          userId: p.user_id,
          date: new Date(p.date),
          amount: Number(p.amount),
          interestAmount: Number(p.interest_amount ?? 0),
          capitalAmount: Number(p.capital_amount ?? p.amount),
          note: p.note,
          receiptUrl: p.receipt_url,
        })));
      }
    } catch (err) {
      console.error('[PublicLoan] Error loading data:', err);
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  // Computed values
  totalPaid = computed(() => LoanCalculator.calculateTotalPaid(this.payments()));
  totalInterestPaid = computed(() => LoanCalculator.calculateTotalInterestPaid(this.payments()));
  totalCapitalPaid = computed(() => LoanCalculator.calculateTotalCapitalPaid(this.payments()));

  balance = computed(() => {
    const l = this.loan();
    if (!l) return 0;
    return LoanCalculator.calculateRemainingBalance(l, this.payments());
  });

  capitalBalance = computed(() => {
    const l = this.loan();
    if (!l) return 0;
    return LoanCalculator.calculateRemainingCapital(l, this.payments());
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

  schedule = computed(() => {
    const l = this.loan();
    if (!l) return [];
    return LoanCalculator.generateInstallmentSchedule(l, this.payments());
  });

  scheduleYears = computed(() => {
    return LoanCalculator.getScheduleYears(this.schedule());
  });

  currentYearSchedule = computed(() => {
    const y = this.selectedYear();
    return this.schedule().filter(inst => new Date(inst.dueDate).getFullYear() === y);
  });

  progressPercent = computed(() => {
    const l = this.loan();
    if (!l) return 0;
    const total = l.totalAmount;
    if (total <= 0) return 0;
    return Math.min(100, Math.round((this.totalPaid() / total) * 100));
  });
}
