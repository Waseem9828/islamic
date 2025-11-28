
import { getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';
import { firebaseConfig } from './config';

// This interface defines the structure of the object returned by initializeFirebase.
export interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
}

/**
 * Initializes Firebase and returns the service instances.
 * 
 * This function ensures that Firebase is only initialized once (singleton pattern)
 * and provides access to the core Firebase services.
 */
export function initializeFirebase(): FirebaseServices {
  // Check if Firebase has already been initialized.
  const apps = getApps();
  const firebaseApp = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);

  // Initialize Firebase services.
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp);
  
  // Initialize Cloud Functions, specifying the correct region.
  // This is crucial for connecting to functions deployed in a non-default region.
  const functions = getFunctions(firebaseApp, 'us-east1');

  // Return the initialized services as an object.
  return { firebaseApp, auth, firestore, storage, functions };
}
