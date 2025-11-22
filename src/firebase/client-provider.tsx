'use client';

import React, { useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './core';

/**
 * A hook that initializes Firebase services and memoizes the result.
 */
export const useFirebase = () => {
  return useMemo(() => initializeFirebase(), []);
};

/**
 * A provider component that initializes Firebase and makes it available to child components.
 */
export const FirebaseClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const firebase = useFirebase();
  
  return (
    <FirebaseProvider
      firebaseApp={firebase.firebaseApp}
      auth={firebase.auth}
      firestore={firebase.firestore}
      storage={firebase.storage}
      functions={firebase.functions}
    >
      {children}
    </FirebaseProvider>
  );
};

export default FirebaseClientProvider;
