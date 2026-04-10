import { Injectable, Injector, inject } from '@angular/core';
import { dbReady } from '../local/app.database';
import { Loan } from '../../domain/models/loan.model';
import { NetworkStatus } from '../../core/store/app.store';

@Injectable({ providedIn: 'root' })
export class LoanRepository {
  private injector = inject(Injector);
  
  async getAllLoans(): Promise<Loan[]> {
    const db = await dbReady;
    return await db.loans.toArray();
  }

  async getLoanById(id: string): Promise<Loan | undefined> {
    const db = await dbReady;
    return await db.loans.get(id);
  }

  async createLoan(loan: Loan, networkStatus: NetworkStatus): Promise<string> {
    const db = await dbReady;

    // 1. Generate local ID
    const loanId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : Date.now().toString(); // fallback
    
    const newLoan = { ...loan, id: loanId };

    // 2. Save locally
    await db.loans.add(newLoan);

    // 3. Queue for sync
    await db.syncQueue.add({
      collection: 'loans',
      operation: 'create',
      payload: newLoan,
      status: 'pending',
      createdAt: new Date()
    });

    // 4. Trigger sync immediately (lazy inject to avoid circular dependency)
    this.triggerSync();

    return loanId;
  }

  async updateLoan(loan: Loan, networkStatus: NetworkStatus): Promise<void> {
    if (!loan.id) return;
    const db = await dbReady;

    // 1. Update locally
    await db.loans.update(loan.id, loan);

    // 2. Queue for sync
    await db.syncQueue.add({
      collection: 'loans',
      operation: 'update',
      payload: loan,
      status: 'pending',
      createdAt: new Date()
    });

    // 3. Trigger sync immediately
    this.triggerSync();
  }

  private triggerSync() {
    // Lazy import to break circular dep: SyncService -> LoanStore -> LoanRepository -> SyncService
    import('../services/sync.service').then(m => {
      const syncService = this.injector.get(m.SyncService);
      syncService.triggerSync();
    });
  }
}
