
import * as admin from 'firebase-admin';

// This is the server-side Firebase initialization.
// It uses service account credentials to gain admin access.

// We need to make sure we only initialize the app once.
if (!admin.apps.length) {
  try {
    // When running in a Google Cloud environment (like Cloud Functions, Cloud Run),
    // the SDK can be initialized without credentials.
    // It will automatically discover the service account credentials.
    admin.initializeApp();
  } catch (e) {
    // If not in a Google Cloud environment, you would need to provide credentials explicitly.
    // This might happen in local development if the emulator is not being used.
    // For this project, we assume it's running in an environment where auto-init works.
    console.error('Firebase admin initialization error', e);
  }
}

const auth = admin.auth();
const db = admin.firestore();

export { auth, db };
