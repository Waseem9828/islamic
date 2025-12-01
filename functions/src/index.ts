
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const regionalFunctions = functions.region("us-east1");

// =====================================================================
//  Helper Functions
// =====================================================================

/**
 * Checks if a user has the admin role.
 * @param {string} uid The user's UID.
 * @return {Promise<boolean>} A promise that resolves to true if the user is an admin.
 */
const isAdmin = async (uid: string): Promise<boolean> => {
  if (!uid) return false;
  try {
    const adminDoc = await db.collection("roles_admin").doc(uid).get();
    return adminDoc.exists;
  } catch (error) {
    console.error(`Error checking admin status for UID: ${uid}`, error);
    return false;
  }
};

/**
 * Throws an "unauthenticated" error if the user is not logged in.
 * @param {functions.https.CallableContext} context The context of the function call.
 */
const ensureAuthenticated = (context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated.",
    );
  }
};

/**
 * Throws a "permission-denied" error if the user is not an admin.
 * @param {functions.https.CallableContext} context The context of the function call.
 */
const ensureAdmin = async (context: functions.https.CallableContext) => {
  ensureAuthenticated(context);
  try {
    const userIsAdmin = await isAdmin(context.auth!.uid);
    if (!userIsAdmin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "This function must be called by an admin.",
      );
    }
  } catch (error) {
    console.error(`Ensure admin check failed for UID: ${context.auth!.uid}`, error);
    throw new functions.https.HttpsError(
      "internal",
      "An internal error occurred while checking for admin permissions.",
    );
  }
};


// =====================================================================
//  Callable Functions
// =====================================================================

export const checkAdminStatus = regionalFunctions.https.onCall(async (_, context) => {
  ensureAuthenticated(context);
  const userIsAdmin = await isAdmin(context.auth!.uid);
  return { isAdmin: userIsAdmin };
});

export const getAdminDashboardStats = regionalFunctions.https.onCall(async (_, context) => {
  await ensureAdmin(context);

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
        totalCommission,
        totalWinnings,
    };
  } catch (error) {
    console.error("Error in getAdminDashboardStats:", error);
    throw new functions.https.HttpsError("internal", "Error fetching admin dashboard stats.");
  }
});


export const updateUserStatus = regionalFunctions.https.onCall(async (data, context) => {
  await ensureAdmin(context);

  const { uid, status } = data;
  if (!uid || !['active', 'suspended'].includes(status)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid UID or status provided.");
  }

  try {
    await db.collection("users").doc(uid).update({ status });
    return { success: true, message: `User ${uid} status updated to ${status}.` };
  } catch (error) {
    console.error("Error in updateUserStatus:", error);
    throw new functions.https.HttpsError("internal", "Error updating user status.");
  }
});


export const getWalletInfo = regionalFunctions.https.onCall(async (data, context) => {
  await ensureAdmin(context);

  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid UID provided.");
  }

  try {
    const walletDoc = await db.collection("wallets").doc(uid).get();
    if (!walletDoc.exists) {
        return { depositBalance: 0, winningBalance: 0, bonusBalance: 0 };
    }
    const walletData = walletDoc.data();
    return {
        depositBalance: walletData?.depositBalance || 0,
        winningBalance: walletData?.winningBalance || 0,
        bonusBalance: walletData?.bonusBalance || 0,
    };
  } catch (error) {
      console.error("Error in getWalletInfo:", error);
      throw new functions.https.HttpsError("internal", "Error fetching wallet info.");
  }
});


export const requestDeposit = regionalFunctions.https.onCall(async (data, context) => {
  ensureAuthenticated(context);
  const uid = context.auth!.uid;

  const { amount, transactionId, screenshotUrl } = data;
  if (!amount || typeof amount !== 'number' || amount <= 0 || !transactionId || !screenshotUrl) {
    throw new functions.https.HttpsError("invalid-argument", "Valid amount, transaction ID, and screenshot URL are required.");
  }

  try {
    const depositRequest = {
        userId: uid,
        amount: amount,
        transactionId: transactionId,
        screenshotUrl: screenshotUrl,
        status: "pending",
        requestedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection("depositRequests").add(depositRequest);
    return { status: "success", message: "Your deposit request has been submitted." };
  } catch (error) {
    console.error("Error in requestDeposit:", error);
    throw new functions.https.HttpsError("internal", "Error processing deposit request.");
  }
});
