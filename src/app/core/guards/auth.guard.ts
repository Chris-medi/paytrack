import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SupabaseService } from '../supabase/supabase.service';
import { from, map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const supabaseService = inject(SupabaseService);

  return from(supabaseService.getCurrentUser()).pipe(
    map((session) => {
      console.log(session)
      if (session) {
        return true;
      } else {
        // Si no hay sesión, redirigir al login
        router.navigate(['/login']);
        return false;
      }
    }),
    catchError((err) => {
      console.error('Auth Guard Error:', err);
      router.navigate(['/login']);
      return of(false);
    })
  );
};
