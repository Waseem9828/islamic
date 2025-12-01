
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { Functions, httpsCallable } from 'firebase/functions';
import { initializeFirebase } from './core';
import { Loader2 } from 'lucide-react';

// 1. Service Initialization State
interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
}

// 2. User Authentication State
interface UserAuthState {
  user: User | null;
  isAdmin: boolean;
  isUserLoading: boolean;
  userError: Error | null;
}

// 3. Combined Context State
export interface FirebaseContextState extends Partial<FirebaseServices>, UserAuthState {}

// Create the context
const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// The Provider Component
export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<FirebaseServices | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [authState, setAuthState] = useState<UserAuthState>({
    user: null,
    isAdmin: false,
    isUserLoading: true,
    userError: null,
  });

  // Effect for initializing Firebase services
  useEffect(() => {
    try {
      const initializedServices = initializeFirebase();
      setServices(initializedServices);
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      // Handle initialization error, maybe set an error state
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Effect for handling authentication state
  useEffect(() => {
    if (!services?.auth) {
      // If services aren't ready, or auth is specifically missing.
      const error = services === null ? undefined : new Error("Auth not initialized");
      setAuthState(prevState => ({ ...prevState, isUserLoading: false, userError: error || null }));
      return;
    }

    const { auth, functions } = services;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthState({ user, isAdmin: false, isUserLoading: true, userError: null });
        try {
          if (functions) {
            const checkAdmin = httpsCallable(functions, 'checkAdminStatus');
            const result = await checkAdmin();
            const isAdminResult = (result.data as { isAdmin: boolean }).isAdmin;
            setAuthState({ user, isAdmin: isAdminResult, isUserLoading: false, userError: null });
          } else {
            throw new Error("Functions not available for admin check.");
          }
        } catch (error: any) {
          console.error("Admin check failed:", error);
          setAuthState({ user, isAdmin: false, isUserLoading: false, userError: error });
        }
      } else {
        setAuthState({ user: null, isAdmin: false, isUserLoading: false, userError: null });
      }
    }, (error) => {
      console.error("onAuthStateChanged error:", error);
      setAuthState({ user: null, isAdmin: false, isUserLoading: false, userError: error });
    });

    return () => unsubscribe();
  }, [services]); // Rerun when services are initialized

  // Memoize the context value
  const contextValue = useMemo(() => ({
    ...(services || {}),
    ...authState,
  }), [services, authState]);

  // Render a loading indicator while services are initializing
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Custom Hooks
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useAuth = () => {
  const { auth, user, isUserLoading, userError } = useFirebase();
  if (!auth) throw new Error('Auth has not been initialized.');
  return { auth, user, isUserLoading, userError };
};

export const useFirestore = () => {
  const { firestore } = useFirebase();
  if (!firestore) throw new Error('Firestore has not been initialized.');
  return firestore;
};

export const useUser = () => {
  const { user, isAdmin, isUserLoading, userError } = useFirebase();
  return { user, isAdmin, isUserLoading, userError };
};
