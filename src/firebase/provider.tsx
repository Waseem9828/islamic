'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { Functions } from 'firebase/functions';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  functions: Functions;
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  functions: Functions | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
  functions,
}) => {
  const [authState, setAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!auth) {
      setAuthState({ user: null, isUserLoading: false, userError: new Error("Auth not initialized") });
      return;
    }
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => setAuthState({ user, isUserLoading: false, userError: null }),
      (error) => setAuthState({ user: null, isUserLoading: false, userError: error })
    );
    return () => unsubscribe();
  }, [auth]);

  const contextValue = useMemo(() => ({
    firebaseApp,
    firestore,
    auth,
    storage,
    functions,
    ...authState,
  }), [firebaseApp, firestore, auth, storage, functions, authState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
