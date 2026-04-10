import Dexie, { Table } from 'dexie';
import { Loan } from '../../domain/models/loan.model';
import { Payment } from '../../domain/models/payment.model';

export interface SyncTask {
  id?: number;
  collection: 'loans' | 'payments';
  operation: 'create' | 'update' | 'delete';
  payload: any;
  status: 'pending' | 'synced' | 'error';
  createdAt: Date;
}

export class AppDatabase extends Dexie {
  loans!: Table<Loan, string>;
  payments!: Table<Payment, string>;
  syncQueue!: Table<SyncTask, number>;

  constructor() {
    super('PaymentHistoryDB');
    
    this.version(2).stores({
      loans: 'id, borrowerDocument, status, createdAt',
      payments: 'id, loanId, date',
      syncQueue: '++id, collection, status, createdAt'
    });
  }
}

export const db = new AppDatabase();
