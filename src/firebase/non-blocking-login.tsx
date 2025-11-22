'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore, functions, auth } from './core';

type AuthCallback = (error?: FirebaseError) => void;

// For backward compatibility
export const getSdks = () => ({ firestore, functions, auth });


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
    .then(async (userCredential) => {
      try {
        // After user is created, create their document in Firestore.
        const user = userCredential.user;
        const userDocRef = doc(firestore, 'users', user.uid);

        const newUser = {
          id: user.uid,
          email: user.email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Use a standard write to create the user document.
        await setDoc(userDocRef, newUser);

        callback(); // Success
      } catch (error) {
         callback(error as FirebaseError); // Firestore error
      }
    })
    .catch((error: FirebaseError) => {
      callback(error); // Auth error
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

export const createUserProfile = async (user: any) => {
  if (!firestore) return;
  
  try {
    const userRef = doc(firestore, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error creating user profile:', error);
  }
};
