
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// IMPORTANT: Replace with your actual service account key file path
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

async function grantAdminRole() {
  const userId = 'Mh28D81npYYDfC3z8mslVIPFu5H3';
  try {
    await db.collection('roles_admin').doc(userId).set({ isAdmin: true });
    console.log(`Successfully granted admin role to user ${userId}`);
  } catch (error) {
    console.error(`Error granting admin role: ${error}`);
  }
}

grantAdminRole();
