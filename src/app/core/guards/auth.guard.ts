import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AppStore } from '../store/app.store';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const appStore = inject(AppStore);

  // appStore.user() will initially be null until onAuthStateChanged fires.
  // We need to wait or rely on Auth state directly if using a synchronous guard.
  // For simplicity, we check if there's a stored user or if localStorage flag exists
  // but better to just use Firebase auth locally.
  import('firebase/auth').then(({ getAuth }) => {
    const auth = getAuth();
    auth.onAuthStateChanged((user) => {
      if (!user) {
        router.navigate(['/login']);
      }
    });
  });

  return true; // Optimistically load, the listener above will redirect if unauthorized.
};
