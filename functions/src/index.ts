
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
        throw new functions.https.HttpsError("unauthenticated", "Admin-only function.");
    }
    const adminDoc = await db.collection("roles_admin").doc(context.auth.uid).get();
    if (!adminDoc.exists) {
        throw new functions.https.HttpsError("permission-denied", "Admin-only function.");
    }
};

export const checkAdminStatus = regionalFunctions.https.onCall(async (_, context) => {
    console.log("--- checkAdminStatus: Start ---");
    if (!context.auth) {
        console.log('checkAdminStatus: Unauthenticated user.');
        return { isAdmin: false };
    }

    const uid = context.auth.uid;
    console.log(`checkAdminStatus: Authenticated user with UID: ${uid}`);

    try {
        console.log(`checkAdminStatus: Accessing Firestore for roles_admin collection...`);
        const adminDocRef = db.collection("roles_admin").doc(uid);
        const adminDoc = await adminDocRef.get();
        console.log(`checkAdminStatus: Firestore query completed.`);

        const isAdmin = adminDoc.exists;
        console.log(`checkAdminStatus for UID ${uid}: ${isAdmin ? 'Admin' : 'Not an Admin'}`);
        return { isAdmin };
    } catch (error) {
        console.error(`Error checking admin status for UID ${uid}:`, error);
        throw new functions.https.HttpsError("internal", "An unexpected error occurred.");
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
