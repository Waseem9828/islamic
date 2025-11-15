import { getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from './config';

// Initialize Firebase
export const initializeFirebase = () => {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }
  return initializeApp(firebaseConfig);
};

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
