import * as admin from 'firebase-admin';

// A function to safely initialize the Firebase Admin SDK and return the services.
// This ensures that initializeApp() is called only once.
function initializeServerApp() {
  if (!admin.apps.length) {
    try {
      // In a Google Cloud environment, the SDK can be initialized without credentials.
      admin.initializeApp();
    } catch (e) {
      console.error('Firebase admin initialization error', e);
      // If you were running locally and NOT in a Google Cloud environment,
      // you would need to provide service account credentials here.
    }
  }
  return {
    auth: admin.auth(),
    db: admin.firestore(),
  };
}

// Export a function that returns the initialized services.
export const getSafeServerAdmin = () => {
    return initializeServerApp();
};
