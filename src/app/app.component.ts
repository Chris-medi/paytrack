import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppStore } from './core/store/app.store';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { SyncService } from './data/services/sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: var(--color-slate-50);
      color: var(--color-slate-900);
    }
  `]
})
export class AppComponent implements OnInit {
  appStore = inject(AppStore);
  syncService = inject(SyncService);

  ngOnInit() {
    // Escuchar el estado de autenticación real en la entrada principal
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      // Pasamos un objeto con propiedades mínimas o null
      if (user) {
        this.appStore.setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        });
        
        // Sync down upon fresh login
        if (navigator.onLine) {
          await this.syncService.syncDown();
        }
      } else {
        this.appStore.setUser(null);
      }
    });

    // Dummy listener for online/offline
    window.addEventListener('online', () => this.appStore.setNetworkStatus('online'));
    window.addEventListener('offline', () => this.appStore.setNetworkStatus('offline'));
    if (!navigator.onLine) {
      this.appStore.setNetworkStatus('offline');
    }
  }
}
