'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize services
const firestore = getFirestore(app);
const functions = getFunctions(app, 'us-east1'); // Specify the correct region
// Pass the storageBucket URL to getStorage
const storage = getStorage(app, firebaseConfig.storageBucket);
const auth = getAuth(app);

// Export the initialized services
export { app, firestore, functions, storage, auth };

// A function to get all SDKs, which can be used in providers
export const initializeFirebase = () => {
  return {
    firebaseApp: app,
    firestore,
    functions,
    storage,
    auth,
  };
};

export const getSdks = initializeFirebase;
