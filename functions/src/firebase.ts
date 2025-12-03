
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

!getApps().length && initializeApp();

export const firestore = getFirestore();
export const auth = getAuth();
