import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { onAuthStateChanged } from 'firebase/auth';
import { FirebaseService } from '../firebase/firebase.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const firebaseService = inject(FirebaseService);

  onAuthStateChanged(firebaseService.auth, async (user) => {
    if (!user) {
      router.navigate(['/login']);
    }
  })

  return true;
};
