'use client';

import React, { useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './core';

/**
 * A hook that initializes Firebase services and memoizes the result.
 * This ensures that Firebase is initialized only once per application lifecycle.
 */
const useFirebaseServices = () => {
  const services = useMemo(() => {
    // The initializeFirebase function handles the entire initialization process,
    // including checking for existing apps and returning all necessary SDKs.
    return initializeFirebase();
  }, []);
  return services;
};

/**
 * Client-side component responsible for initializing Firebase and providing its services
 * to the rest of the application through the FirebaseProvider.
 * This should wrap the root layout of the application.
 */
export const ClientFirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get the singleton instances of Firebase services.
  const { firebaseApp, auth, firestore, storage, functions } = useFirebaseServices();

  // Pass the initialized services down to the context provider.
  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
      storage={storage}
      functions={functions}
    >
      {children}
    </FirebaseProvider>
  );
};
