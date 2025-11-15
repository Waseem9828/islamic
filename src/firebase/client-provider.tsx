'use client';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { useMemo } from 'react';
import {
  FirebaseProvider,
  initializeFirebase,
  useFirebaseApp,
} from '@/firebase';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const app = useFirebaseApp();
  const auth = useMemo(() => (app ? getAuth(app) : undefined), [app]);
  const firestore = useMemo(() => (app ? getFirestore(app) : undefined), [app]);
  const storage = useMemo(() => (app ? getStorage(app) : undefined), [app]);

  return (
    <FirebaseProvider
      auth={auth}
      firestore={firestore}
      firebaseApp={app}
      storage={storage}
    >
      {children}
    </FirebaseProvider>
  );
}
