import { Component, input } from "@angular/core";
import { CommonModule, CurrencyPipe, DatePipe } from "@angular/common";
import { ScheduledInstallment } from '../../domain/models/loan.model'

@Component({
  selector: 'app-cart-paid-details',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    @if (inst(); as item) {
      <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
        <!-- Status color line indicator -->
        <div class="absolute left-0 top-0 bottom-0 w-1"
          [ngClass]="{
            'bg-emerald-500': item.status === 'paid',
            'bg-amber-500': item.status === 'partial',
            'bg-slate-300 dark:bg-slate-600': item.status === 'pending',
            'bg-rose-500': item.status === 'overdue'
          }"></div>
          
        <div class="flex justify-between items-center mb-3">
          <p class="font-bold text-sm text-slate-800 dark:text-slate-200">
            Cuota #{{ item.number }} 
            @if (item.paidDate) {
              <span class="text-slate-500 font-medium ml-1">· {{ item.paidDate | date:'MMM/dd/HH:mm' }}</span>
            }
          </p>
          
          <div class="gap-2 flex items-center">
            <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
            [ngClass]="{
              'bg-emerald-100 text-emerald-700': item.status === 'paid',
              'bg-amber-100 text-amber-700': item.status === 'partial',
              'bg-slate-100 text-slate-600': item.status === 'pending',
              'bg-rose-100 text-rose-700': item.status === 'overdue'
             }">
            {{ item.status === 'paid' ? 'Pagada' : (item.status === 'partial' ? 'Parcial' : (item.status === 'overdue' ? 'Atrasada' : 'Pendiente')) }}
           </span>
           <span class="text-xs text-slate-500">{{ item.dueDate | date:'MMM d' }}</span>
         </div>
        </div>
        <div class="flex flex-col gap-2">
          <div class="flex justify-between text-xs items-center">
            <span class="text-slate-500">Capital</span>
            <div class="flex items-center gap-2">
              @if (item.capitalPaid > 0) {
                <span class="text-emerald-600 font-bold">{{ item.capitalPaid | currency:'COP':'symbol-narrow':'1.2-2' }}</span>
                <span class="text-slate-300 dark:text-slate-600">/</span>
              }
              <span class="text-slate-700 dark:text-slate-300 font-medium">{{ item.capitalDue | currency:'COP':'symbol-narrow':'1.2-2' }}</span>
            </div>
          </div>
          <div class="flex justify-between text-xs items-center">
            <span class="text-slate-500">Interés</span>
            <div class="flex items-center gap-2">
              @if (item.interestPaid > 0) {
                <span class="text-emerald-600 font-bold">{{ item.interestPaid | currency:'COP':'symbol-narrow':'1.2-2' }}</span>
                <span class="text-slate-300 dark:text-slate-600">/</span>
              }
              <span class="text-slate-700 dark:text-slate-300 font-medium">{{ item.interestDue | currency:'COP':'symbol-narrow':'1.2-2' }}</span>
            </div>
          </div>
          <div class="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
          <div class="flex justify-between text-sm items-center font-bold">
            <span class="text-slate-800 dark:text-slate-200">Total</span>
            <span class="text-slate-800 dark:text-slate-200">{{ item.totalDue | currency:'COP':'symbol-narrow':'1.2-2' }}</span>
          </div>
        </div>
      </div>
    }
  `
})
export class CartPaidDetailsComponent {
  inst = input.required<ScheduledInstallment>();
}