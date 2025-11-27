import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";

// Import the cors middleware
import cors from "cors";

const corsHandler = cors({ origin: true });

// Safely initialize the Firebase Admin SDK, preventing re-initialization.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * A Firebase Cloud Function to set custom user claims, specifically for the 'admin' role.
 * This function is callable via an HTTPS request.
 * 
 * @param {functions.https.CallableContext} context - The context of the function call.
 *   - `context.auth.uid`: The UID of the user making the call. This user must be an admin.
 *   - `context.data.uid`: The UID of the target user whose claims are to be set.
 *   - `context.data.role`: The role to be assigned (e.g., 'admin').
 */
export const setUserRole = functions.https.onCall(async (data, context) => {
  // 1. Authentication & Authorization Check
  // Ensure the user making the request is authenticated and is an admin.
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can set user roles.'
    );
  }

  const { uid, role } = data;

  // 2. Input Validation
  // Ensure the target UID and role are provided.
  if (!uid || typeof uid !== 'string' || !role || typeof role !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with the UID and role of the target user.'
    );
  }

  try {
    // 3. Set Custom User Claims
    // Set the custom claim for the target user (e.g., { admin: true }).
    await admin.auth().setCustomUserClaims(uid, { [role]: true });

    // 4. Update Firestore Role Collection (for client-side checks)
    // This provides a way for the client to easily check roles without needing to force-refresh ID tokens.
    const rolesCollection = role === 'admin' ? 'roles_admin' : 'roles_user'; // Example logic
    await db.collection(rolesCollection).doc(uid).set({ role: role }, { merge: true });

    // 5. Success Response
    return { 
      status: 'success',
      message: `Successfully set user ${uid} to role ${role}.`
    };
  } catch (error) {
    // 6. Error Handling
    console.error('Error setting user role:', error);
    throw new functions.https.HttpsError(
      'internal',
      'An internal error occurred while setting the user role.',
      error
    );
  }
});
