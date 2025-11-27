'use client';
import {
  Auth,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore, functions, auth } from './core';


// For backward compatibility
export const getSdks = () => ({ firestore, functions, auth });

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
