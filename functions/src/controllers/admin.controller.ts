
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { firestore } from "../firebase';
import { assertAuthenticated } from "../utils/auth";
import { adminsCollection, Admin } from "../collections/admins";

/**
 * Gets a list of all admins.
 * Requires the user to be an authenticated super admin.
 */
export const getAllAdmins = onCall(async (request) => {
    // Ensure the user is a super admin.
    const { uid, token } = await assertAuthenticated(request);
    if (token.role !== 'super') {
        throw new HttpsError('permission-denied', "You must be a super admin to view other admins.");
    }

    try {
        const adminsSnapshot = await adminsCollection.get();
        const admins = adminsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Admin[];
        return { admins };
    } catch (error) {
        // Log the error for debugging purposes.
        console.error("Error fetching admins:", error);

        // Throw a generic error to the client.
        throw new HttpsError('internal', "An unexpected error occurred while fetching admins.");
    }
});
