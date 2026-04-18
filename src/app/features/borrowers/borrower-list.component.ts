import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { LoanStore } from '../loans/store/loan.store';

@Component({
  selector: 'app-borrower-list',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="flex flex-col gap-4 h-full">
      
      <header class="pt-2 mb-2">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100">Clientes</h2>
        <p class="text-sm text-slate-500">Agrupados por nombre</p>
      </header>

      @if (loanStore.loading()) {
        <div class="flex justify-center p-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      }

      @if (!loanStore.loading()) {
        <div class="flex flex-col gap-3 pb-4">
          
          @for (client of groupedBorrowers(); track client.name) {
            <div class="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-3">
              
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-inner text-white font-bold text-lg">
                  {{ client.name.charAt(0) | uppercase }}
                </div>
                <div>
                  <h3 class="font-bold text-slate-900 dark:text-white text-lg leading-tight">{{ client.name }}</h3>
                  <p class="text-xs text-slate-500 tracking-wide font-medium flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    {{ client.location }}
                  </p>
                </div>
              </div>

              <div class="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 grid grid-cols-3 gap-2 mt-2 border border-slate-100 dark:border-slate-700">
                <div class="text-center col-span-1 border-r border-slate-200 dark:border-slate-600">
                  <p class="text-[10px] text-slate-400 uppercase font-semibold">Préstamos</p>
                  <p class="font-bold text-slate-800 dark:text-slate-200">{{ client.totalLoans }}</p>
                </div>
                <div class="text-center col-span-2">
                  <p class="text-[10px] text-slate-400 uppercase font-semibold">Total Pendiente (Aprox)</p>
                  <p class="font-bold text-emerald-600 dark:text-emerald-400">{{ client.totalAmountPending | currency:'COP':'symbol-narrow':'1.2-2' }}</p>
                </div>
              </div>

            </div>
          }

          @if (groupedBorrowers().length === 0) {
            <div class="text-center py-10 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <p class="text-slate-500 dark:text-slate-400">No hay clientes registrados.</p>
            </div>
          }

        </div>
      }
    </div>
  `
})
export class BorrowerListComponent implements OnInit {
  loanStore = inject(LoanStore);

  ngOnInit() {
    this.loanStore.loadLoans();
  }

  // Agrupación usando computed property
  groupedBorrowers = computed(() => {
    const loans = this.loanStore.loans();
    const groupMap = new Map<string, any>();

    loans.forEach(loan => {
      if (!groupMap.has(loan.borrowerName)) {
        groupMap.set(loan.borrowerName, {
          name: loan.borrowerName,
          location: loan.borrowerLocation,
          totalLoans: 0,
          totalAmountPending: 0
        });
      }

      const current = groupMap.get(loan.borrowerName);
      current.totalLoans += 1;

      // Calculate pending (approx unless payments loaded, for now we sum totalAmount)
      if (loan.status !== 'paid') {
        current.totalAmountPending += (loan.totalInstallments * loan.installmentValue);
      }
    });

    return Array.from(groupMap.values()).map(client => ({
      ...client,
      totalAmountPending: Number(client.totalAmountPending.toFixed(2))
    })).sort((a, b) => a.name.localeCompare(b.name));
  });
}
