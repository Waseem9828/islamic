import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

const regionalFunctions = functions.region("us-east1");

// =====================================================================
//  Helper Functions
// =====================================================================

/**
 * Checks if a user is an administrator.
 * @param {string} uid The user's UID.
 * @returns {Promise<boolean>} A promise that resolves to true if the user is an admin.
 */
const isAdmin = async (uid: string): Promise<boolean> => {
    // This is a hardcoded "super admin" for emergency access.
    // Consider removing this in a real production environment.
    if (uid === "Mh28D81npYYDfC3z8mslVIPFu5H3") {
        return true;
    }
    const adminDoc = await db.collection("roles_admin").doc(uid).get();
    return adminDoc.exists;
};

// =====================================================================
//  Callable Functions
// =====================================================================

/**
 * Checks if the currently authenticated user is an admin.
 */
export const checkAdminStatus = regionalFunctions.https.onCall(async (_, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const userIsAdmin = await isAdmin(context.auth.uid);
    return { isAdmin: userIsAdmin };
});


/**
 * Fetches statistics for the admin dashboard.
 * Only callable by admins.
 */
export const getAdminDashboardStats = regionalFunctions.https.onCall(async (_, context) => {
    if (!context.auth || !(await isAdmin(context.auth.uid))) {
        throw new functions.https.HttpsError("permission-denied", "User is not an admin.");
    }

    try {
        const usersSnapshot = await db.collection("users").get();
        const matchesSnapshot = await db.collection("matches").get();
        const depositsSnapshot = await db.collection("depositRequests").where("status", "==", "pending").get();
        const withdrawalsSnapshot = await db.collection("withdrawalRequests").where("status", "==", "pending").get();

        const totalCommission = matchesSnapshot.docs.reduce((sum, doc) => sum + (doc.data().commission || 0), 0);
        
        const winningsPaidSnapshot = await db.collection("transactions").where("reason", "==", "match_win").get();
        const totalWinnings = winningsPaidSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);


        return {
            totalUsers: usersSnapshot.size,
            activeMatches: matchesSnapshot.docs.filter(doc => doc.data().status === "inprogress").length,
            pendingDeposits: depositsSnapshot.size,
            pendingWithdrawals: withdrawalsSnapshot.size,
            totalCommission: totalCommission,
            totalWinnings: totalWinnings,
        };
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw new functions.https.HttpsError("internal", "Could not fetch dashboard statistics.");
    }
});

/**
 * Updates a user's status (e.g., to 'active' or 'suspended').
 * Only callable by admins.
 */
export const updateUserStatus = regionalFunctions.https.onCall(async (data, context) => {
    if (!context.auth || !(await isAdmin(context.auth.uid))) {
        throw new functions.https.HttpsError("permission-denied", "User is not an admin.");
    }

    const { uid, status } = data;
    if (!uid || !["active", "suspended"].includes(status)) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid UID or status provided.");
    }

    try {
        await db.collection("users").doc(uid).update({ status });
        return { success: true, message: `User ${uid} status updated to ${status}.` };
    } catch (error) {
        console.error("Error updating user status:", error);
        throw new functions.https.HttpsError("internal", `Could not update status for user ${uid}.`);
    }
});

/**
 * Gets wallet information for a specific user.
 * Only callable by admins.
 */
export const getWalletInfo = regionalFunctions.https.onCall(async (data, context) => {
    if (!context.auth || !(await isAdmin(context.auth.uid))) {
        throw new functions.https.HttpsError("permission-denied", "User is not an admin.");
    }

    const { uid } = data;
    if (!uid) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid UID provided.");
    }

    try {
        const walletDoc = await db.collection("wallets").doc(uid).get();
        if (!walletDoc.exists) {
            // Return a default wallet structure if it doesn't exist
            return {
                depositBalance: 0,
                winningBalance: 0,
                bonusBalance: 0,
            };
        }
        const walletData = walletDoc.data();
        return {
            depositBalance: walletData?.depositBalance || 0,
            winningBalance: walletData?.winningBalance || 0,
            bonusBalance: walletData?.bonusBalance || 0,
        };
    } catch (error) {
        console.error("Error getting wallet info:", error);
        throw new functions.https.HttpsError("internal", "Could not retrieve wallet information.");
    }
});


/**
 * Handles a deposit request from an authenticated user.
 */
export const requestDeposit = regionalFunctions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { amount, transactionId, screenshotUrl } = data;
  if (!amount || !transactionId || !screenshotUrl) {
      throw new functions.https.HttpsError("invalid-argument", "Amount, transaction ID, and screenshot URL are required.");
  }
    
  if (typeof amount !== 'number' || amount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid amount provided.');
  }

  try {
    const depositRequest = {
      userId: context.auth.uid,
      amount: amount,
      transactionId: transactionId,
      screenshotUrl: screenshotUrl,
      status: "pending",
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("depositRequests").add(depositRequest);

    return { status: "success", message: "Your deposit request has been submitted for verification." };

  } catch (error) {
    console.error("Error processing deposit request for UID:", context.auth.uid, error);
    throw new functions.https.HttpsError(
      "internal",
      "An unexpected error occurred while processing your request."
    );
  }
});
