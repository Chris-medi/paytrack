import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { environment } from '../../../environments/environment';

export const initFirebase = () => {
  const app = getApps().length === 0 ? initializeApp(environment.firebase) : getApp();

  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return { app, auth, firestore };
};
