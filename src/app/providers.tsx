'use client';

import { FirebaseProvider } from '@/firebase';
import { app, auth, firestore, storage, functions } from '@/firebase/client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProvider 
        firebaseApp={app} 
        auth={auth} 
        firestore={firestore} 
        storage={storage} 
        functions={functions}
    >
      {children}
    </FirebaseProvider>
  );
}
