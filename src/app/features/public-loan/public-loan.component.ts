import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../core/supabase/supabase.service';

interface PublicLoan {
  id: string;
  borrowerName: string;
  borrowerLocation: string;
  totalAmount: number;
  monthlyInterest: number;
  totalInstallments: number;
  installmentValue: number;
  startDate: Date;
  firstDueDate: Date;
  nextDueDate: Date;
  status: string;
  createdAt: Date;
}

interface PublicPayment {
  id: string;
  date: Date;
  amount: number;
  note?: string;
}

@Component({
  selector: 'app-public-loan',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
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
            
            <p class="text-emerald-100 text-xs uppercase tracking-widest font-semibold mb-2">Saldo Pendiente</p>
            <h3 class="text-4xl font-bold tracking-tight mb-4">{{ balance() | currency:'COP':'symbol-narrow':'1.0-0' }}</h3>
            
            <div class="flex justify-between items-center border-t border-emerald-400/30 pt-4">
              <div>
                <p class="text-[10px] text-emerald-200 uppercase tracking-widest font-semibold">Valor Cuota</p>
                <p class="font-semibold text-lg">{{ loan()!.installmentValue | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
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
              <p class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Valor Total</p>
              <p class="text-lg font-bold text-white">{{ totalExpected() | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
            </div>
            <div class="bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 text-center">
              <p class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Total Abonado</p>
              <p class="text-lg font-bold text-emerald-400">{{ totalPaid() | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
            </div>
            <div class="bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 text-center">
              <p class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Cuotas Totales</p>
              <p class="text-lg font-bold text-white">{{ loan()!.totalInstallments }}</p>
            </div>
            <div class="bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-700/50 text-center">
              <p class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Cuotas Pagadas</p>
              <p class="text-lg font-bold text-emerald-400">{{ paidInstallments() }} <span class="text-sm text-slate-500">/ {{ loan()!.totalInstallments }}</span></p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="mb-8">
            <div class="flex justify-between text-xs text-slate-400 mb-2">
              <span>Progreso</span>
              <span>{{ progressPercent() }}%</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700/50">
              <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700 ease-out" 
                   [style.width.%]="progressPercent()"></div>
            </div>
          </div>

          <!-- Payment History -->
          <div>
            <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              Historial de Pagos
            </h3>
            
            <div class="flex flex-col gap-3">
              @for (payment of payments(); track payment.id) {
                <div class="bg-slate-800/60 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 flex justify-between items-center">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-white">Pago recibido</p>
                      <p class="text-xs text-slate-500">{{ payment.date | date:'dd MMM yyyy, h:mm a' }}</p>
                      @if (payment.note) {
                        <p class="text-xs text-slate-400 mt-0.5 italic">{{ payment.note }}</p>
                      }
                    </div>
                  </div>
                  <p class="font-bold text-emerald-400 text-lg">+{{ payment.amount | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
                </div>
              }

              @if (payments().length === 0) {
                <div class="text-center py-8 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                  <p class="text-sm text-slate-500">Sin pagos registrados aún.</p>
                </div>
              }
            </div>
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

  loan = signal<PublicLoan | null>(null);
  payments = signal<PublicPayment[]>([]);
  loading = signal(true);
  error = signal(false);

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
        totalAmount: Number(loanData.total_amount),
        monthlyInterest: Number(loanData.monthly_interest),
        totalInstallments: Number(loanData.total_installments),
        installmentValue: Number(loanData.installment_value),
        startDate: new Date(loanData.start_date),
        firstDueDate: new Date(loanData.first_due_date),
        nextDueDate: new Date(loanData.next_due_date),
        status: loanData.status,
        createdAt: new Date(loanData.created_at),
      });

      // Fetch payments for this loan
      const { data: paymentsData, error: paymentsError } = await this.supabaseService.supabase
        .from('payments')
        .select('id, date, amount, note')
        .eq('loan_id', loanId)
        .order('date', { ascending: false });

      if (!paymentsError && paymentsData) {
        this.payments.set(paymentsData.map(p => ({
          id: p.id,
          date: new Date(p.date),
          amount: Number(p.amount),
          note: p.note,
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
  totalExpected = computed(() => {
    const l = this.loan();
    if (!l) return 0;
    return l.totalInstallments * l.installmentValue;
  });

  totalPaid = computed(() => {
    return this.payments().reduce((acc, p) => acc + p.amount, 0);
  });

  balance = computed(() => {
    return this.totalExpected() - this.totalPaid();
  });

  paidInstallments = computed(() => {
    const l = this.loan();
    if (!l) return 0;
    return Math.floor(this.totalPaid() / l.installmentValue);
  });

  nextDueDate = computed(() => {
    const l = this.loan();
    if (!l) return new Date();
    const paid = this.paidInstallments();
    if (paid >= l.totalInstallments) return l.nextDueDate;
    const nextDate = new Date(l.firstDueDate);
    nextDate.setMonth(nextDate.getMonth() + paid);
    return nextDate;
  });

  currentStatus = computed(() => {
    const l = this.loan();
    if (!l) return 'active';
    const bal = this.balance();
    if (bal <= 0) return 'paid';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(this.nextDueDate());
    due.setHours(0, 0, 0, 0);

    if (today > due) return 'late';
    return 'active';
  });

  progressPercent = computed(() => {
    const total = this.totalExpected();
    if (total <= 0) return 0;
    return Math.min(100, Math.round((this.totalPaid() / total) * 100));
  });
}
