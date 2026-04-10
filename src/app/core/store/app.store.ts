import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';

export type NetworkStatus = 'online' | 'offline';

export interface AppState {
  user: any | null; 
  networkStatus: NetworkStatus;
  syncQueueLength: number;
  isSyncing: boolean;
}

const initialState: AppState = {
  user: null,
  networkStatus: 'online', 
  syncQueueLength: 0,
  isSyncing: false
};

export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setUser(user: any | null) {
      patchState(store, { user });
    },
    setNetworkStatus(status: NetworkStatus) {
      patchState(store, { networkStatus: status });
    },
    updateSyncQueueLength(length: number) {
      patchState(store, { syncQueueLength: length });
    },
    setIsSyncing(isSyncing: boolean) {
      patchState(store, { isSyncing });
    }
  }))
);
