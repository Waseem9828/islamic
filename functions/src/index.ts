
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// Internal helper function to check for admin privileges
const _isAdmin = async (uid: string): Promise<boolean> => {
    const adminDoc = await db.collection("roles_admin").doc(uid).get();
    return adminDoc.exists;
};

// Callable function to check if a user is an admin
export const checkAdminStatus = functions
  .region("us-east1")
  .https.onCall(async (_, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated.",
      );
    }
    const isAdmin = await _isAdmin(context.auth.uid);
    return { isAdmin };
  });

// Callable function to get admin dashboard stats
export const getAdminDashboardStats = functions
  .region("us-east1")
  .https.onCall(async (_, context) => {
    if (!context.auth || !(await _isAdmin(context.auth.uid))) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "User is not an admin.",
      );
    }

    // Fetch stats
    const usersSnapshot = await db.collection("users").get();
    const depositsSnapshot = await db.collection("deposits").where("status", "==", "completed").get();
    const withdrawalsSnapshot = await db.collection("withdrawals").where("status", "==", "completed").get();

    const totalUsers = usersSnapshot.size;
    const totalDeposits = depositsSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
    const totalWithdrawals = withdrawalsSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);

    return {
      totalUsers,
      totalDeposits,
      totalWithdrawals,
    };
  });

// Callable function to update a user's status
export const updateUserStatus = functions
  .region("us-east1")
  .https.onCall(async (data, context) => {
    if (!context.auth || !(await _isAdmin(context.auth.uid))) {
        throw new functions.https.HttpsError(
            "permission-denied",
            "User is not an admin."
        );
    }

    const { uid, status } = data;
    if (!uid || !['active', 'suspended'].includes(status)) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Invalid UID or status provided.'
        );
    }

    await admin.firestore().collection('users').doc(uid).update({ status });
    return { success: true };
});

// New callable function to get wallet info for a specific user
export const getWalletInfo = functions
    .region("us-east1")
    .https.onCall(async (data, context) => {
        if (!context.auth || !(await _isAdmin(context.auth.uid))) {
            throw new functions.https.HttpsError(
                "permission-denied",
                "User is not an admin."
            );
        }

        const { uid } = data;
        if (!uid) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Invalid UID provided.'
            );
        }

        const walletDoc = await admin.firestore().collection('wallets').doc(uid).get();
        
        if (!walletDoc.exists) {
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
    });
