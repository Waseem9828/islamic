'use client';

import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import React, { createContext, useContext, useMemo } from 'react';
import { initializeFirebase } from '.';

// Define the context shape
interface FirebaseContextType {
  firebaseApp: FirebaseApp | undefined;
  auth: Auth | undefined;
  firestore: Firestore | undefined;
  storage: FirebaseStorage | undefined;
}

// Create the context
const FirebaseContext = createContext<FirebaseContextType>({
  firebaseApp: undefined,
  auth: undefined,
  firestore: undefined,
  storage: undefined,
});

// Custom hook to use the Firebase context
export const useFirebase = () => {
  return useContext(FirebaseContext);
};
export const useAuth = () => {
  return useFirebase().auth;
};
export const useFirestore = () => {
  return useFirebase().firestore;
};

export const useStorage = () => {
  return useFirebase().storage;
};

// Custom hook that initializes the Firebase app
export const useFirebaseApp = () => {
  return useMemo(() => initializeFirebase(), []);
};

// Provider component
export const FirebaseProvider = ({
  children,
  firebaseApp,
  auth,
  firestore,
  storage,
}: {
  children: React.ReactNode;
  firebaseApp: FirebaseApp | undefined;
  auth: Auth | undefined;
  firestore: Firestore | undefined;
  storage: FirebaseStorage | undefined;
}) => {
  return (
    <FirebaseContext.Provider
      value={{ firebaseApp, auth, firestore, storage }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};
