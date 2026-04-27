import { Component, input } from "@angular/core";
import { CommonModule, CurrencyPipe, DatePipe } from "@angular/common";
import { Payment } from "../../domain/models/payment.model";

@Component({
  selector: 'app-cart-paid-history',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    @if (payment(); as p) {
      <div class="bg-white dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 flex flex-col gap-2 shadow-sm backdrop-blur-sm">
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-800 dark:text-white">Pago recibido</p>
              <p class="text-xs text-slate-500 dark:text-slate-500">{{ p.date | date:'dd MMM yyyy, h:mm a' }}</p>
            </div>
          </div>
          <p class="font-bold text-emerald-600 dark:text-emerald-400 text-lg">+{{ p.amount | currency:'COP':'symbol-narrow':'1.2-2' }}</p>
        </div>
        
        <div class="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2 mt-1 flex justify-between text-xs">
          <div class="text-slate-600 dark:text-slate-400">
            <span class="font-semibold text-slate-700 dark:text-slate-300">Capital:</span> {{ (p.capitalAmount || 0) | currency:'COP':'symbol-narrow':'1.2-2' }}
          </div>
          <div class="text-slate-600 dark:text-slate-400">
            <span class="font-semibold text-slate-700 dark:text-slate-300">Interés:</span> {{ (p.interestAmount || 0) | currency:'COP':'symbol-narrow':'1.2-2' }}
          </div>
        </div>

        @if (p.note) {
          <p class="text-xs text-slate-500 dark:text-slate-400 px-1 mt-1 italic">{{ p.note }}</p>
        }
      </div>
    }
  `
})
export class CartPaidHistoryComponent {
  payment = input.required<Payment>();
}
