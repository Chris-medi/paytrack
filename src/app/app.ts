import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppStore } from './core/store/app.store';
import { SyncService } from './data/services/sync.service';
import { SupabaseService } from './core/supabase/supabase.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  appStore = inject(AppStore);
  syncService = inject(SyncService);
  private supabaseService = inject(SupabaseService);
  private authSub?: Subscription;

  async ngOnInit() {

    // Listen to Supabase auth state changes
    this.authSub = this.supabaseService.authState$.subscribe(async ({ event, session }) => {
      if (session?.user) {
        this.appStore.setUser({
          uid: session.user.id,
          email: session.user.email ?? null,
          displayName: session.user.user_metadata?.['full_name'] ?? session.user.email ?? null,
        });
        await this.syncService.fullSync();
      } else {
        this.appStore.setUser(null);
      }
    });

    // Also check current session on init (for page refreshes)
    const currentSession = await this.supabaseService.getCurrentUser();
    if (currentSession?.user) {
      this.appStore.setUser({
        uid: currentSession.user.id,
        email: currentSession.user.email ?? null,
        displayName: currentSession.user.user_metadata?.['full_name'] ?? currentSession.user.email ?? null,
      });
      await this.syncService.fullSync();
    }

    // Dummy listener for online/offline
    window.addEventListener('online', () => this.appStore.setNetworkStatus('online'));
    window.addEventListener('offline', () => this.appStore.setNetworkStatus('offline'));
    if (!navigator.onLine) {
      this.appStore.setNetworkStatus('offline');
    }
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
  }
}
