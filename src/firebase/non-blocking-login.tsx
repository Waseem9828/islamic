'use client';
import {
  Auth,
  User,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { getFirestore, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from './non-blocking-updates';
import { getSdks } from './core';

type AuthCallback = (error?: FirebaseError) => void;

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(
  authInstance: Auth,
  email: string,
  password: string,
  callback: AuthCallback
): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then((userCredential) => {
      // After user is created, create their document in Firestore.
      const user = userCredential.user;
      const { firestore } = getSdks(authInstance.app);
      const userDocRef = doc(firestore, 'users', user.uid);

      const newUser = {
        id: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        subscriptions: [],
      };

      // Use a non-blocking write to create the user document.
      setDocumentNonBlocking(userDocRef, newUser, {});

      callback(); // Success
    })
    .catch((error: FirebaseError) => {
      callback(error); // Failure
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(
  authInstance: Auth,
  email: string,
  password: string,
  callback: AuthCallback
): void {
  signInWithEmailAndPassword(authInstance, email, password)
    .then(() => {
      callback(); // Success
    })
    .catch((error: FirebaseError) => {
      callback(error); // Failure
    });
}
