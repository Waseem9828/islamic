'use client';

import { FirebaseProvider } from '@/firebase';
import { initializeFirebase } from '@/firebase/core';

// Initialize Firebase and get the services
const firebaseServices = initializeFirebase();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProvider 
        {...firebaseServices}
    >
      {children}
    </FirebaseProvider>
  );
}
