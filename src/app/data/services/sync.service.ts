import { Injectable, effect, inject } from '@angular/core';
import { dbReady } from '../local/app.database';
import { SupabaseService } from '../../core/supabase/supabase.service';
import { AppStore } from '../../core/store/app.store';
import { LoanStore } from '../../features/loans/store/loan.store';

@Injectable({ providedIn: 'root' })
export class SyncService {
  appStore = inject(AppStore);
  loanStore = inject(LoanStore);
  private supabaseService = inject(SupabaseService);

  private supabase = this.supabaseService.supabase;
  private syncInterval: any;
  private isSyncing = false;

  constructor() {
    // Escuchar cambios de estado de red
    effect(() => {
      const isOnline = this.appStore.networkStatus() === 'online';
      const user = this.appStore.user();

      if (isOnline && user) {
        this.processSyncQueue();
        this.startPeriodicSync();
      } else {
        this.stopPeriodicSync();
      }
    });
  }

  /**
   * Trigger sync inmediato — llamado desde repositorios después de escribir a la cola
   */
  async triggerSync() {
    if (this.appStore.networkStatus() === 'online' && this.appStore.user()) {
      await this.processSyncQueue();
    }
  }

  private isSyncingDown = false;

  /**
   * Sincronización descendente (Supabase -> IndexedDB)
   * Descarga TODOS los datos del usuario desde Supabase y los guarda localmente.
   */
  async syncDown() {
    if (this.isSyncingDown) return;

    const user = this.appStore.user();
    if (!user) return;

    this.isSyncingDown = true;
    const db = await dbReady;

    try {
      this.appStore.setIsSyncing(true);
      console.log('[Sync] Starting syncDown for user:', user.uid);

      // 1. Obtener préstamos de Supabase
      const { data: remoteLoans, error: loansError } = await this.supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.uid);

      if (loansError) {
        console.error('[Sync] Error fetching loans:', loansError);
        return;
      }

      const mappedLoans = (remoteLoans || []).map(l => this.mapLoanFromSupabase(l));
      console.log(`[Sync] Found ${mappedLoans.length} loans in Supabase`);

      // Limpiar datos locales y reemplazar con los de Supabase
      await db.loans.clear();
      if (mappedLoans.length > 0) {
        await db.loans.bulkPut(mappedLoans as any[]);
      }

      // 2. Obtener pagos
      const { data: remotePayments, error: paymentsError } = await this.supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.uid);

      if (paymentsError) {
        console.error('[Sync] Error fetching payments:', paymentsError);
        return;
      }

      const mappedPayments = (remotePayments || []).map(p => this.mapPaymentFromSupabase(p));
      console.log(`[Sync] Found ${mappedPayments.length} payments in Supabase`);

      await db.payments.clear();
      if (mappedPayments.length > 0) {
        await db.payments.bulkPut(mappedPayments as any[]);
      }

      console.log('[Sync] syncDown completed successfully');

    } catch (error) {
      console.error('[Sync] Error syncing down from Supabase:', error);
    } finally {
      this.appStore.setIsSyncing(false);
      this.isSyncingDown = false;
      // Refresh UI con los datos actualizados de IndexedDB
      await this.loanStore.loadLoans();
    }
  }

  /**
   * Sincronización completa: primero sube pendientes, luego descarga todo
   */
  async fullSync() {
    await this.processSyncQueue(); // Subir cambios locales pendientes primero
    await this.syncDown();         // Luego descargar todo de Supabase
  }

  /**
   * Sincronización ascendente (IndexedDB SyncQueue -> Supabase)
   */
  async processSyncQueue() {
    const user = this.appStore.user();
    if (!user || this.isSyncing) return;

    const db = await dbReady;
    let queueLength = await db.syncQueue.where('status').equals('pending').count();
    this.appStore.updateSyncQueueLength(queueLength);

    if (queueLength === 0) {
      return; // Nada que sincronizar
    }

    this.isSyncing = true;
    this.appStore.setIsSyncing(true);

    const pendingItems = await db.syncQueue.where('status').equals('pending').toArray();

    for (const item of pendingItems) {
      try {
        const payload = item.payload;

        if (item.collection === 'loans') {
          const supabaseData = this.mapLoanToSupabase(payload, user.uid);

          if (item.operation === 'create') {
            const { error } = await this.supabase.from('loans').upsert(supabaseData);
            if (error) throw error;
          } else if (item.operation === 'update') {
            const { error } = await this.supabase.from('loans').upsert(supabaseData);
            if (error) throw error;
          }
        } else if (item.collection === 'payments') {
          const supabaseData = this.mapPaymentToSupabase(payload, user.uid);

          if (item.operation === 'create') {
            const { error } = await this.supabase.from('payments').upsert(supabaseData);
            if (error) throw error;
          } else if (item.operation === 'update') {
            const { error } = await this.supabase.from('payments').upsert(supabaseData);
            if (error) throw error;
          }
        }

        // Marcar como procesado en la cola
        await db.syncQueue.update(item.id!, { status: 'synced' });
        console.log(`[Sync] Synced ${item.operation} on ${item.collection}/${payload.id}`);

      } catch (error) {
        console.error('[Sync] Error procesando item de la cola', item, error);
        // Si falla, se queda como pending para intentar luego
      }
    }

    queueLength = await db.syncQueue.where('status').equals('pending').count();
    this.appStore.updateSyncQueueLength(queueLength);
    this.appStore.setIsSyncing(false);
    this.isSyncing = false;
  }

  /**
   * Mapea un loan local (camelCase) a formato Supabase (snake_case)
   */
  private mapLoanToSupabase(loan: any, userId: string): any {
    return {
      id: loan.id,
      user_id: userId,
      borrower_name: loan.borrowerName,
      borrower_location: loan.borrowerLocation,
      borrower_phone: loan.borrowerPhone || null,
      principal_amount: loan.principalAmount || loan.totalAmount,
      total_amount: loan.totalAmount,
      monthly_interest: loan.monthlyInterest,
      annual_interest: loan.annualInterest,
      total_installments: loan.totalInstallments,
      installment_value: loan.installmentValue,
      start_date: loan.startDate instanceof Date ? loan.startDate.toISOString() : loan.startDate,
      first_due_date: loan.firstDueDate instanceof Date ? loan.firstDueDate.toISOString() : loan.firstDueDate,
      next_due_date: loan.nextDueDate instanceof Date ? loan.nextDueDate.toISOString() : loan.nextDueDate,
      status: loan.status,
      created_at: loan.createdAt instanceof Date ? loan.createdAt.toISOString() : loan.createdAt,
    };
  }

  /**
   * Mapea un loan de Supabase (snake_case) a formato local (camelCase)
   */
  private mapLoanFromSupabase(row: any): any {
    return {
      id: row.id,
      userId: row.user_id,
      borrowerName: row.borrower_name,
      borrowerLocation: row.borrower_location,
      borrowerPhone: row.borrower_phone,
      principalAmount: Number(row.principal_amount || row.total_amount),
      totalAmount: Number(row.total_amount),
      monthlyInterest: Number(row.monthly_interest),
      annualInterest: Number(row.annual_interest),
      totalInstallments: Number(row.total_installments),
      installmentValue: Number(row.installment_value),
      startDate: new Date(row.start_date),
      firstDueDate: new Date(row.first_due_date),
      nextDueDate: new Date(row.next_due_date),
      status: row.status,
      createdAt: new Date(row.created_at),
    };
  }

  /**
   * Mapea un payment local a formato Supabase
   */
  private mapPaymentToSupabase(payment: any, userId: string): any {
    return {
      id: payment.id,
      loan_id: payment.loanId,
      user_id: userId,
      date: payment.date instanceof Date ? payment.date.toISOString() : payment.date,
      amount: payment.amount,
      interest_amount: payment.interestAmount !== undefined ? payment.interestAmount : 0,
      capital_amount: payment.capitalAmount !== undefined ? payment.capitalAmount : payment.amount,
      receipt_url: payment.receiptUrl || null,
      note: payment.note || null,
    };
  }

  /**
   * Mapea un payment de Supabase a formato local
   */
  private mapPaymentFromSupabase(row: any): any {
    return {
      id: row.id,
      loanId: row.loan_id,
      userId: row.user_id,
      date: new Date(row.date),
      amount: Number(row.amount),
      interestAmount: Number(row.interest_amount || 0),
      capitalAmount: Number(row.capital_amount !== undefined && row.capital_amount !== null ? row.capital_amount : row.amount),
      receiptUrl: row.receipt_url,
      note: row.note,
    };
  }

  // Sync periódico: sube pendientes + descarga actualizaciones cada 60s
  private startPeriodicSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.syncInterval = setInterval(() => {
      this.fullSync();
    }, 60000 * 10);
  }

  private stopPeriodicSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);
  }
}
