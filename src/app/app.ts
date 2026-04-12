import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppStore } from './core/store/app.store';
import { SyncService } from './data/services/sync.service';
import { onAuthStateChanged } from 'firebase/auth';
import { FirebaseService } from './core/firebase/firebase.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  appStore = inject(AppStore);
  syncService = inject(SyncService);
  private firebaseService = inject(FirebaseService)

  async ngOnInit() {

    onAuthStateChanged(this.firebaseService.auth, async (user) => {
      if (user) {
        this.appStore.setUser(user);
        await this.syncService.fullSync();
      } else {
        this.appStore.setUser(null);
      }
    })

    // Dummy listener for online/offline
    window.addEventListener('online', () => this.appStore.setNetworkStatus('online'));
    window.addEventListener('offline', () => this.appStore.setNetworkStatus('offline'));
    if (!navigator.onLine) {
      this.appStore.setNetworkStatus('offline');
    }
  }
}
