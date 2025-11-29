
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { Functions, httpsCallable } from 'firebase/functions';
import { initializeFirebase } from './core';

interface UserAuthState {
  user: User | null;
  isAdmin: boolean;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState extends UserAuthState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  functions: Functions | null;
}

const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { firebaseApp, auth, firestore, storage, functions } = useMemo(() => initializeFirebase(), []);

  const [authState, setAuthState] = useState<UserAuthState>({
    user: null,
    isAdmin: false,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!auth) {
      setAuthState({ user: null, isAdmin: false, isUserLoading: false, userError: new Error("Auth not initialized") });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in. First, set the user and loading state.
        setAuthState({ user, isAdmin: false, isUserLoading: true, userError: null });

        // Now, check for admin status.
        try {
          if (functions) {
            const checkAdmin = httpsCallable(functions, 'checkAdminStatus');
            const result = await checkAdmin();
            const isAdminResult = (result.data as { isAdmin: boolean }).isAdmin;
            // Final state with user and admin status
            setAuthState({ user, isAdmin: isAdminResult, isUserLoading: false, userError: null });
          } else {
             // Fallback if functions aren't ready for some reason
            setAuthState({ user, isAdmin: false, isUserLoading: false, userError: new Error("Functions not available for admin check.") });
          }
        } catch (error: any) {
          console.error("Admin check failed:", error);
          // Set user but indicate admin check failed.
          setAuthState({ user, isAdmin: false, isUserLoading: false, userError: error });
        }
      } else {
        // User is signed out.
        setAuthState({ user: null, isAdmin: false, isUserLoading: false, userError: null });
      }
    }, (error) => {
      // Handle errors in the auth listener itself.
      console.error("onAuthStateChanged error:", error);
      setAuthState({ user: null, isAdmin: false, isUserLoading: false, userError: error });
    });

    return () => unsubscribe();
  }, [auth, functions]);

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

export const useAuth = () => {
  const { auth } = useFirebase();
  if (!auth) {
    throw new Error('Auth has not been initialized.');
  }
  return auth;
};

export const useFirestore = () => {
  const { firestore } = useFirebase();
  if (!firestore) {
    throw new Error('Firestore has not been initialized.');
  }
  return firestore;
};

export const useUser = () => {
  const { user, isAdmin, isUserLoading, userError } = useFirebase();
  return { user, isAdmin, isUserLoading, userError };
};
