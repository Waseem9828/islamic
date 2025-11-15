'use client';

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './config';
export * from './client-provider';
export * from '../hooks/use-memo-firebase';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

function initializeFirebase() {
  if (getApps().length > 0) {
    return {
      firebaseApp: getApp(),
      auth: getAuth(),
      firestore: getFirestore(),
      storage: getStorage(),
    };
  }

  const firebaseApp = initializeApp(firebaseConfig);
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp);

  return { firebaseApp, auth, firestore, storage };
}

export { initializeFirebase };
