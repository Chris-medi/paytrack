import { Injectable } from '@angular/core';
import { db } from '../local/app.database';
import { Payment } from '../../domain/models/payment.model';
import { NetworkStatus } from '../../core/store/app.store';

@Injectable({ providedIn: 'root' })
export class PaymentRepository {

  async getPaymentsByLoanId(loanId: string): Promise<Payment[]> {
    return await db.payments.where('loanId').equals(loanId).toArray();
  }

  async addPayment(payment: Payment, networkStatus: NetworkStatus): Promise<string> {
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

    return paymentId;
  }
}
