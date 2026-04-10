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

const DB_NAME = 'PaymentHistoryDB';
const DB_SCHEMA_VERSION = 2; // Bumped from 1 to force recreation

export class AppDatabase extends Dexie {
  loans!: Table<Loan, string>;
  payments!: Table<Payment, string>;
  syncQueue!: Table<SyncTask, number>;

  constructor() {
    super(DB_NAME);
    
    this.version(DB_SCHEMA_VERSION).stores({
      loans: 'id, borrowerDocument, status, createdAt',
      payments: 'id, loanId, date',
      syncQueue: '++id, collection, status, createdAt'
    });
  }
}

/**
 * Borra la BD vieja si existe con schema incompatible y crea una nueva.
 * Los datos se re-sincronizarán desde Firebase con syncDown().
 */
async function initDatabase(): Promise<AppDatabase> {
  try {
    const database = new AppDatabase();
    await database.open();
    return database;
  } catch (err: any) {
    if (err.name === 'UpgradeError') {
      console.warn('[DB] UpgradeError detected, deleting old database...', err.message);
      await Dexie.delete(DB_NAME);
      const freshDb = new AppDatabase();
      await freshDb.open();
      console.log('[DB] Fresh database created successfully');
      return freshDb;
    }
    throw err;
  }
}

// Promise que resuelve a la instancia limpia de la BD
export const dbReady: Promise<AppDatabase> = initDatabase();

// Alias sincrónico — Dexie auto-opens on first table access,
// pero puede fallar si el schema viejo existe. Los repositorios
// deben usar dbReady en su lugar.
export const db = new AppDatabase();
