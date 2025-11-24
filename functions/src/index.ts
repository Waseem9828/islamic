
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
    // If there's no auth context, the user is not logged in, so they can't be an admin.
    if (!context.auth) {
        // This is not an error, just a status check.
        return { isAdmin: false };
    }

    const uid = context.auth.uid;
    try {
        const adminDocRef = db.collection("roles_admin").doc(uid);
        const adminDoc = await adminDocRef.get();
        // The result is simply whether the document for this user exists in the admin collection.
        return { isAdmin: adminDoc.exists };
    } catch (error) {
        console.error(`Error in checkAdminStatus for UID ${uid}:`, error);
        // Instead of crashing and returning 'internal', throw a specific HttpsError
        // so the client can handle it gracefully.
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


// --- Matches Management by Admin ---
export const getMatches = regionalFunctions.https.onCall(async (_, context) => {
    await ensureIsAdmin(context);
    try {
        const matchesSnapshot = await db.collection('matches').orderBy('createdAt', 'desc').get();
        const matches = matchesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { matches };
    } catch (error) {
        console.error("Error fetching matches:", error);
        throw new functions.https.HttpsError("internal", "Could not fetch matches.");
    }
});


export const cancelMatchByAdmin = regionalFunctions.https.onCall(async (data, context) => {
    await ensureIsAdmin(context);
    const { matchId } = data;
    if (typeof matchId !== 'string' || matchId.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid Match ID provided.");
    }
    
    const matchRef = db.collection("matches").doc(matchId);
    
    return db.runTransaction(async (t) => {
        const matchDoc = await t.get(matchRef);
        if (!matchDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Match not found.");
        }
        const matchData = matchDoc.data();

        if (matchData?.status === 'completed' || matchData?.status === 'cancelled') {
            throw new functions.https.HttpsError("failed-precondition", "Match is already completed or cancelled.");
        }

        // Refund entry fee for all players
        const playerRefundPromises = matchData.players.map(async (playerId: string) => {
            const playerWalletRef = db.collection('wallets').doc(playerId);
            const playerTxQuery = db.collection('transactions')
                .where('userId', '==', playerId)
                .where('matchId', '==', matchId)
                .where('reason', 'in', ['match_creation', 'match_join']);
            
            const txSnapshot = await playerTxQuery.get();

            if (!txSnapshot.empty) {
                const txDoc = txSnapshot.docs[0];
                const txData = txDoc.data();
                const refundAmount = txData.amount;
                
                // Refund the amount to the user's wallet
                t.update(playerWalletRef, {
                    depositBalance: admin.firestore.FieldValue.increment(refundAmount)
                });

                // Create a refund transaction record
                const refundTxRef = db.collection('transactions').doc();
                t.set(refundTxRef, {
                    userId: playerId,
                    type: 'credit',
                    amount: refundAmount,
                    reason: 'match_cancellation_refund',
                    status: 'completed',
                    matchId: matchId,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        });
        
        await Promise.all(playerRefundPromises);
        
        // Finally, update the match status to 'cancelled'
        t.update(matchRef, { 
            status: 'cancelled',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { status: 'success', message: `Match ${matchId} has been cancelled and all players refunded.` };
    });
});

