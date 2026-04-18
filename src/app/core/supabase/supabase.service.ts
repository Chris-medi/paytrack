import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { createClient, SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js'
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public readonly supabase: SupabaseClient

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey)
  }

  async loginWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${environment.publicBaseUrl}/dashboard`
      }
    });
    if (!error) {
      return data;
    }
    return error;
  }

  authState$ = new Observable<{ event: AuthChangeEvent, session: Session | null }>(subscriber => {
    const { data: listener } = this.supabase.auth.onAuthStateChange((event, session) => {
      subscriber.next({ event, session });
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  });

  async getCurrentUser() {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      return error;
    }
    return true;
  }

  async invokeFunction(functionName: string, body: any) {
    const { data, error } = await this.supabase.functions.invoke(functionName, { body });
    if (error) {
      return error;
    }
    return data;
  }
}
