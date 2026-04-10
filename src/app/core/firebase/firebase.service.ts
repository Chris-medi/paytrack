import { Injectable } from '@angular/core';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  public readonly app: FirebaseApp;
  public readonly auth: Auth;
  public readonly firestore: Firestore;


  constructor() {
    this.app = getApps().length === 0
      ? initializeApp(environment.firebase)
      : getApp();

    this.auth = getAuth(this.app);
    this.firestore = getFirestore(this.app);
  }
}
