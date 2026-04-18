import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';


export type NetworkStatus = 'online' | 'offline';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface AppState {
  user: AppUser | null;
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
    setUser(user: AppUser | null) {
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
