import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { Payment } from '../../../domain/models/payment.model';
import { PaymentRepository } from '../../../data/repositories/payment.repository';
import { AppStore } from '../../../core/store/app.store';

export interface PaymentState {
  payments: Payment[];
  loading: boolean;
  syncStatus: 'pending' | 'synced' | 'error';
}

const initialState: PaymentState = {
  payments: [],
  loading: false,
  syncStatus: 'synced'
};

export const PaymentStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, paymentRepo = inject(PaymentRepository), appStore = inject(AppStore)) => ({
    
    async loadPayments(loanId: string) {
      patchState(store, { loading: true });
      try {
        const payments = await paymentRepo.getPaymentsByLoanId(loanId);
        patchState(store, { payments, loading: false });
      } catch (error) {
        console.error("Failed to load payments", error);
        patchState(store, { loading: false });
      }
    },

    async addPayment(payment: Payment) {
      patchState(store, { loading: true });
      try {
        const id = await paymentRepo.addPayment(payment, appStore.networkStatus());
        const createdPayment = { ...payment, id };
        
        patchState(store, (state) => ({ 
          payments: [...state.payments, createdPayment],
          loading: false,
          syncStatus: 'pending' as const
        }));
      } catch (error) {
        console.error("Failed to add payment", error);
        patchState(store, { loading: false, syncStatus: 'error' });
      }
    }
  }))
);
