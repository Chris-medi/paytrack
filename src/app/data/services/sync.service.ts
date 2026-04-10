import { Injectable, effect, inject } from '@angular/core';
import { dbReady } from '../local/app.database';
import { FirebaseService } from '../../core/firebase/firebase.service';
import { collection, doc, setDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { AppStore } from '../../core/store/app.store';
import { LoanStore } from '../../features/loans/store/loan.store';

@Injectable({ providedIn: 'root' })
export class SyncService {
  appStore = inject(AppStore);
  loanStore = inject(LoanStore);
  private firebaseService = inject(FirebaseService);

  private firestore = this.firebaseService.firestore;
  private auth = this.firebaseService.auth;
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
    if (this.appStore.networkStatus() === 'online' && this.auth.currentUser) {
      await this.processSyncQueue();
    }
  }

  /**
   * Sincronización descendente (Firestore -> IndexedDB)
   */
  async syncDown() {
    const user = this.auth.currentUser;
    if (!user) return;

    const db = await dbReady;

    try {
      this.appStore.setIsSyncing(true);

      // 1. Obtener préstamos de Firestore
      const loansRef = collection(this.firestore, `users/${user.uid}/loans`);
      const loansSnapshot = await getDocs(loansRef);
      const remoteLoans = loansSnapshot.docs.map(d => ({
        id: d.id,
        ...this.convertTimestampsToDate(d.data())
      }));

      // Guardar en Dexie
      if (remoteLoans.length > 0) {
        await db.loans.bulkPut(remoteLoans as any[]);
      }

      // 2. Obtener pagos
      const paymentsRef = collection(this.firestore, `users/${user.uid}/payments`);
      const paymentsSnapshot = await getDocs(paymentsRef);
      const remotePayments = paymentsSnapshot.docs.map(d => ({
        id: d.id,
        ...this.convertTimestampsToDate(d.data())
      }));

      if (remotePayments.length > 0) {
        await db.payments.bulkPut(remotePayments as any[]);
      }

    } catch (error) {
      console.error('Error syncing down from Firestore:', error);
    } finally {
      this.appStore.setIsSyncing(false);
      this.loanStore.loadLoans(); // Refresh UI
    }
  }

  /**
   * Sincronización ascendente (IndexedDB SyncQueue -> Firestore)
   */
  async processSyncQueue() {
    const user = this.auth.currentUser;
    if (!user || this.isSyncing) return;

    this.isSyncing = true;
    this.appStore.setIsSyncing(true);

    const db = await dbReady;

    let queueLength = await db.syncQueue.where('status').equals('pending').count();
    this.appStore.updateSyncQueueLength(queueLength);

    const pendingItems = await db.syncQueue.where('status').equals('pending').toArray();

    for (const item of pendingItems) {
      try {
        // Convert all date-like values to Firestore Timestamps
        const payload = this.convertDatesToTimestamps(item.payload);

        // Set remote doc
        // Estructura: users/{userId}/{collection}/{itemId}
        const docRef = doc(this.firestore, `users/${user.uid}/${item.collection}`, payload.id);
        
        if (item.operation === 'create' || item.operation === 'update') {
          await setDoc(docRef, payload, { merge: true });
        }

        // Marcar como procesado en la cola
        await db.syncQueue.update(item.id!, { status: 'synced' });
        
      } catch (error) {
        console.error('Error procesando item de la cola', item, error);
        // Si falla, se queda como pending para intentar luego
      }
    }

    queueLength = await db.syncQueue.where('status').equals('pending').count();
    this.appStore.updateSyncQueueLength(queueLength);
    this.appStore.setIsSyncing(false);
    this.isSyncing = false;
  }

  /**
   * Convierte Date objects y strings ISO a Firestore Timestamps para subir
   */
  private convertDatesToTimestamps(data: any): any {
    const converted = { ...data };
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T/;

    for (const key of Object.keys(converted)) {
      const val = converted[key];
      if (val instanceof Date) {
        converted[key] = Timestamp.fromDate(val);
      } else if (typeof val === 'string' && isoDateRegex.test(val) && !isNaN(Date.parse(val))) {
        converted[key] = Timestamp.fromDate(new Date(val));
      }
    }
    return converted;
  }

  /**
   * Convierte Firestore Timestamps a JS Date al descargar
   */
  private convertTimestampsToDate(data: any): any {
    const converted = { ...data };
    for (const key of Object.keys(converted)) {
      const val = converted[key];
      if (val && typeof val.toDate === 'function') {
        // Firestore Timestamp → JS Date
        converted[key] = val.toDate();
      }
    }
    return converted;
  }

  // Poll cada minuto si la app está abierta y hay red
  private startPeriodicSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.syncInterval = setInterval(() => {
      this.processSyncQueue();
    }, 60000);
  }

  private stopPeriodicSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);
  }
}
