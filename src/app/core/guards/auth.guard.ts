import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AppStore } from '../store/app.store';
import { FirebaseService } from '../firebase/firebase.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const appStore = inject(AppStore);
  const firebaseService = inject(FirebaseService);

  // Consider using a boolean flag or a more robust check
  // For now, we listen to the auth state
  firebaseService.auth.onAuthStateChanged((user) => {
    if (!user) {
      router.navigate(['/login']);
    }
  });

  return true;
};
