
import * as admin from 'firebase-admin';

// Correctly initialize the Firebase Admin SDK.
// This ensures that initializeApp() is called only once on the server.
if (!admin.apps.length) {
  admin.initializeApp();
}

const auth = admin.auth();
const db = admin.firestore();

export { auth, db };
