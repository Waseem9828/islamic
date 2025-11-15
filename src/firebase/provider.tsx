'use client';

import { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

type FirebaseContextValue = {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
};

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

type FirebaseProviderProps = {
  children: React.ReactNode;
  value: FirebaseContextValue;
};

export function FirebaseProvider({ children, value }: FirebaseProviderProps) {
  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function useFirebaseApp() {
  const { firebaseApp } = useFirebase();
  if (!firebaseApp) {
    throw new Error('Firebase app not initialized');
  }
  return firebaseApp;
}

export function useAuth() {
  const { auth } = useFirebase();
  if (!auth) {
    const app = useFirebaseApp();
    return getAuth(app);
  }
  return auth;
}

export function useFirestore() {
  const { firestore } = useFirebase();
  if (!firestore) {
    const app = useFirebaseApp();
    return getFirestore(app);
  }
  return firestore;
}

export function useStorage() {
  const { storage } = useFirebase();
  if (!storage) {
    const app = useFirebaseApp();
    return getStorage(app);
  }
  return storage;
}
