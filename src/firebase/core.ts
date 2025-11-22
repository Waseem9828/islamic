
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length) {
    // If already initialized, return the SDKs with the already initialized App
    return getSdks(getApp());
  }

  let firebaseApp: FirebaseApp;
  
  // When in a development environment, we will always use the config object.
  if (process.env.NODE_ENV === 'development') {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    // In a production environment (like App Hosting), we will attempt to initialize without
    // any arguments. This allows Firebase to use the automatically provided environment variables.
    try {
      firebaseApp = initializeApp();
    } catch (e) {
      console.warn(
        'Automatic Firebase initialization failed. Falling back to the local firebaseConfig object. This might be due to a missing `FIREBASE_CONFIG` environment variable.',
        e
      );
      firebaseApp = initializeApp(firebaseConfig);
    }
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp),
    functions: getFunctions(firebaseApp),
  };
}
