import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoanStore } from './store/loan.store';

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule, RouterLink],
  template: `
    <div class="flex flex-col gap-4 h-full">
      
      <header class="pt-2">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100">Préstamos</h2>
      </header>

      <!-- Búsqueda y Filtros -->
      <div class="flex flex-col gap-3">
        <!-- Search bar -->
        <div class="relative">
          <span class="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </span>
          <input 
            type="text" 
            [ngModel]="searchQuery()" 
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Buscar por nombre o cédula..." 
            class="w-full bg-white dark:bg-slate-800 border py-3 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm">
        </div>

        <!-- Filter and Sort Row -->
        <div class="flex gap-2">
          <select 
            [ngModel]="statusFilter()"
            (ngModelChange)="statusFilter.set($event)"
            class="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-emerald-500">
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="late">En Mora</option>
            <option value="paid">Pagados</option>
          </select>

          <select 
            [ngModel]="sortBy()"
            (ngModelChange)="sortBy.set($event)"
            class="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-emerald-500">
            <option value="nextDueDate">Próxima Cuota</option>
            <option value="totalAmount">Monto Total</option>
            <option value="createdAt">Fecha Creación</option>
            <option value="borrowerName">Nombre A-Z</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      @if (loanStore.loading()) {
        <div class="flex justify-center p-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      }

      <!-- List of loans -->
      @if (!loanStore.loading()) {
        <div class="flex flex-col gap-3 overflow-y-auto pb-4">
          
          @for (loan of filteredAndSortedLoans(); track loan.id) {
            <div [routerLink]="['/loans', loan.id]"
                 class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm active:scale-95 transition-transform">
              
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h3 class="font-semibold text-slate-900 dark:text-white">{{ loan.borrowerName }}</h3>
                  <p class="text-xs text-slate-500">CC: {{ loan.borrowerDocument }}</p>
                </div>
                
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      [ngClass]="{
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400': loan.status === 'active',
                        'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400': loan.status === 'late',
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300': loan.status === 'paid'
                      }">
                  {{ loan.status === 'late' ? 'Mora' : (loan.status === 'paid' ? 'Pagado' : 'Activo') }}
                </span>
              </div>

              <div class="flex justify-between items-end mt-4">
                <div>
                  <p class="text-[10px] text-slate-400 uppercase tracking-wide">Próxima Cuota</p>
                  <p class="font-medium text-slate-700 dark:text-slate-200">
                    <span class="text-emerald-600 dark:text-emerald-400 font-bold mr-1">
                      {{ loan.installmentValue | currency:'COP':'symbol-narrow':'1.0-0' }}
                    </span>
                    <span class="text-xs"> ({{ loan.nextDueDate | date:'d MMM' }})</span>
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-[10px] text-slate-400 uppercase tracking-wide">Total</p>
                  <p class="font-semibold text-slate-800 dark:text-slate-100">{{ loan.totalAmount | currency:'COP':'symbol-narrow':'1.0-0' }}</p>
                </div>
              </div>
            </div>
          }

          @if (filteredAndSortedLoans().length === 0) {
            <div class="text-center py-10 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <p class="text-slate-500 dark:text-slate-400">No se encontraron préstamos.</p>
            </div>
          }

        </div>
      }
      
    </div>
  `
})
export class LoanListComponent {
  loanStore = inject(LoanStore);

  // Filtros reactivos
  searchQuery = signal('');
  statusFilter = signal('all'); 
  sortBy = signal('nextDueDate');

  filteredAndSortedLoans = computed(() => {
    let result = this.loanStore.loans();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const sort = this.sortBy();

    if (query) {
      result = result.filter(l => 
        l.borrowerName.toLowerCase().includes(query) || 
        l.borrowerDocument.includes(query)
      );
    }

    if (status !== 'all') {
      result = result.filter(l => l.status === status);
    }

    return result.sort((a, b) => {
      if (sort === 'nextDueDate') {
        return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
      }
      if (sort === 'totalAmount') {
        return b.totalAmount - a.totalAmount;
      }
      if (sort === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sort === 'borrowerName') {
        return a.borrowerName.localeCompare(b.borrowerName);
      }
      return 0;
    });
  });

  ngOnInit() {
    this.loanStore.loadLoans();
  }
}
