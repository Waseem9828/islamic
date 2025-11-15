'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

type AuthCallback = (error?: FirebaseError) => void;

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, callback: AuthCallback): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(() => {
      callback(); // Success
    })
    .catch((error: FirebaseError) => {
      callback(error); // Failure
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string, callback: AuthCallback): void {
  signInWithEmailAndPassword(authInstance, email, password)
    .then(() => {
      callback(); // Success
    })
    .catch((error: FirebaseError) => {
      callback(error); // Failure
    });
}
