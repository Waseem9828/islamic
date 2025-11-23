
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Safely initialize the Firebase Admin SDK, preventing re-initialization.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
// Define the function region to match the Firestore database.
const regionalFunctions = functions.region("us-east1");


// --- Helpers ---
const ensureIsAdmin = async (context: functions.https.CallableContext) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication is required to perform this action.");
    }
    const adminDoc = await db.collection("roles_admin").doc(context.auth.uid).get();
    if (!adminDoc.exists) {
        throw new functions.https.HttpsError("permission-denied", "You must be an admin to perform this action.");
    }
};

export const checkAdminStatus = regionalFunctions.https.onCall(async (_, context) => {
    if (!context.auth) {
        return { isAdmin: false };
    }

    const uid = context.auth.uid;
    try {
        const adminDocRef = db.collection("roles_admin").doc(uid);
        const adminDoc = await adminDocRef.get();
        return { isAdmin: adminDoc.exists };
    } catch (error) {
        console.error(`Error in checkAdminStatus for UID ${uid}:`, error);
        throw new functions.https.HttpsError("unknown", "An error occurred while checking admin status.");
    }
});


// --- Admin & Roles Functions ---
export const getAdminDashboardStats = regionalFunctions.https.onCall(async (_, context) => {
    await ensureIsAdmin(context);

    try {
        const [ 
            usersSnapshot,
            matchesSnapshot, 
            depositsSnapshot, 
            withdrawalsSnapshot,
            appConfigSnapshot
        ] = await Promise.all([
            db.collection("users").get(),
            db.collection("matches").where("status", "in", ["waiting", "inprogress"]).get(),
            db.collection("depositRequests").where("status", "==", "pending").get(),
            db.collection("withdrawalRequests").where("status", "==", "pending").get(),
            db.collection("settings").doc("finances").get()
        ]);

        const totalUsers = usersSnapshot.size;
        const activeMatches = matchesSnapshot.size;
        const pendingDeposits = depositsSnapshot.size;
        const pendingWithdrawals = withdrawalsSnapshot.size;

        const financeConfig = appConfigSnapshot.data() || { totalCommission: 0, totalWinnings: 0 };
        const totalCommission = financeConfig.totalCommission;
        const totalWinnings = financeConfig.totalWinnings;

        return {
            totalUsers,
            activeMatches,
            pendingDeposits,
            pendingWithdrawals,
            totalCommission,
            totalWinnings,
        };

    } catch (error) {
        console.error("Error aggregating dashboard stats:", error);
        throw new functions.https.HttpsError(
            "internal",
            "An error occurred while calculating statistics.",
        );
    }
});
