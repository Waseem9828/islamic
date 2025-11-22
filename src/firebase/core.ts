'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const firestore = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export { getFirestore, getFunctions, getStorage, getAuth };

export const initializeFirebase = () => {
  return {
    firebaseApp: app, 
    firestore,
    functions,
    storage,
    auth
  };
};

export const getSdks = initializeFirebase;

export default app;
