import { Injectable } from '@angular/core';
import { db } from '../local/app.database';
import { Loan } from '../../domain/models/loan.model';
import { NetworkStatus } from '../../core/store/app.store';

@Injectable({ providedIn: 'root' })
export class LoanRepository {
  
  async getAllLoans(): Promise<Loan[]> {
    return await db.loans.toArray();
  }

  async getLoanById(id: string): Promise<Loan | undefined> {
    return await db.loans.get(id);
  }

  async createLoan(loan: Loan, networkStatus: NetworkStatus): Promise<string> {
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

    // We can try to sync immediately if online, but that logic usually goes to a SyncService
    return loanId;
  }
}
