import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

export const firebaseConfig = {
  "projectId": "studio-4431476254-c1156",
  "appId": "1:23513776021:web:3e5b6870112641c0fac09c",
  "apiKey": "AIzaSyAHRqi6FiM0jjMIqX0j7Jwj91s0JLyAKak",
  "authDomain": "studio-4431476254-c1156.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "23513776021",
  "storageBucket": "studio-4431476254-c1156.appspot.com"
};


const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { app, firestore, auth, storage, functions };
