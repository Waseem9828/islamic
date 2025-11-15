'use client';

import { useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// App is a function that returns an app instance.
function App() {
  const app = useMemo(() => {
    const apps = getApps();
    if (apps.length === 0) {
      return initializeApp(firebaseConfig);
    } else {
      return getApp();
    }
  }, []);
  return app;
}

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const app = App();
  const auth = useMemo(() => getAuth(app), [app]);
  const firestore = useMemo(() => getFirestore(app), [app]);

  return (
    <FirebaseProvider app={app} auth={auth} firestore={firestore}>
      {children}
    </FirebaseProvider>
  );
}
