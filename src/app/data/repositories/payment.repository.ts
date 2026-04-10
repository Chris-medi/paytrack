import { Injectable, Injector, inject } from '@angular/core';
import { dbReady } from '../local/app.database';
import { Payment } from '../../domain/models/payment.model';
import { NetworkStatus } from '../../core/store/app.store';

@Injectable({ providedIn: 'root' })
export class PaymentRepository {
  private injector = inject(Injector);

  async getPaymentsByLoanId(loanId: string): Promise<Payment[]> {
    const db = await dbReady;
    return await db.payments.where('loanId').equals(loanId).toArray();
  }

  async addPayment(payment: Payment, networkStatus: NetworkStatus): Promise<string> {
    const db = await dbReady;

    const paymentId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Date.now().toString();

    const newPayment = { ...payment, id: paymentId };

    await db.payments.add(newPayment);

    // Queue for sync
    await db.syncQueue.add({
      collection: 'payments',
      operation: 'create',
      payload: newPayment,
      status: 'pending',
      createdAt: new Date()
    });

    // Trigger sync immediately
    this.triggerSync();

    return paymentId;
  }

  private triggerSync() {
    import('../services/sync.service').then(m => {
      const syncService = this.injector.get(m.SyncService);
      syncService.triggerSync();
    });
  }
}
