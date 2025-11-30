
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
  const userIsAdmin = await isAdmin(context.auth!.uid);
  if (!userIsAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "This function must be called by an admin.",
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

export const requestWithdrawal = regionalFunctions.https.onCall(async (data, context) => {
    ensureAuthenticated(context);
    const uid = context.auth!.uid;

    const { amount, upiId } = data;
    if (!amount || typeof amount !== 'number' || amount <= 0 || !upiId) {
        throw new functions.https.HttpsError("invalid-argument", "A valid amount and UPI ID are required.");
    }

    const walletRef = db.collection('wallets').doc(uid);

    return db.runTransaction(async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User wallet not found.');
        }

        const winningBalance = walletDoc.data()?.winningBalance || 0;
        if (winningBalance < amount) {
            throw new functions.https.HttpsError('failed-precondition', 'Insufficient winning balance.');
        }

        const newWinningBalance = winningBalance - amount;
        transaction.update(walletRef, { winningBalance: newWinningBalance });

        const withdrawalRequest = {
            userId: uid,
            amount,
            upiId,
            status: 'pending',
            requestedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const requestRef = db.collection('withdrawalRequests').doc();
        transaction.set(requestRef, withdrawalRequest);
        
        return { result: { status: 'success', message: 'Withdrawal request submitted.' } };
    }).catch(error => {
        console.error("Withdrawal transaction failed:", error);
        throw new functions.https.HttpsError('internal', 'An error occurred during the withdrawal request.');
    });
});


export const processWithdrawal = regionalFunctions.https.onCall(async (data, context) => {
    await ensureAdmin(context);

    const { requestId, approve } = data;
    if (!requestId || typeof approve !== 'boolean') {
        throw new functions.https.HttpsError('invalid-argument', 'Request ID and approval status are required.');
    }

    const requestRef = db.collection('withdrawalRequests').doc(requestId);

    return db.runTransaction(async (t) => {
        const requestDoc = await t.get(requestRef);
        if (!requestDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Withdrawal request not found.');
        }

        const requestData = requestDoc.data();
        if (requestData?.status !== 'pending') {
            throw new functions.https.HttpsError('failed-precondition', 'Request is not in pending state.');
        }

        const newStatus = approve ? 'approved' : 'rejected';
        t.update(requestRef, { status: newStatus });

        // If rejecting, we need to refund the user's winningBalance
        if (!approve) {
            const walletRef = db.collection('wallets').doc(requestData.userId);
            t.update(walletRef, { winningBalance: admin.firestore.FieldValue.increment(requestData.amount) });
        }
        
        // Log transaction for both approved and rejected
        const transactionRef = db.collection('transactions').doc();
        t.set(transactionRef, {
            userId: requestData.userId,
            amount: requestData.amount,
            type: 'debit',
            reason: 'withdrawal_request',
            status: newStatus,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            relatedRequestId: requestId,
        });

        return { status: 'success', message: `Request has been ${newStatus}.` };
    }).catch(error => {
        console.error("Error processing withdrawal:", error);
        throw new functions.https.HttpsError('internal', 'An error occurred while processing the withdrawal.');
    });
});

export const createMatch = regionalFunctions.https.onCall(async (data, context) => {
    ensureAuthenticated(context);
    const uid = context.auth!.uid;
    const { matchId, matchTitle, entryFee, maxPlayers, privacy, timeLimit } = data;
    
    const walletRef = db.collection('wallets').doc(uid);
    const matchRef = db.collection('matches').doc(matchId);
    
    return db.runTransaction(async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        const currentBalance = (walletDoc.data()?.depositBalance || 0) + (walletDoc.data()?.winningBalance || 0);

        if (currentBalance < entryFee) {
            throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance to create match.');
        }
        
        const newBalance = walletDoc.data()?.depositBalance >= entryFee 
            ? { depositBalance: admin.firestore.FieldValue.increment(-entryFee) }
            : { winningBalance: admin.firestore.FieldValue.increment(-entryFee) };

        transaction.update(walletRef, newBalance);

        transaction.set(matchRef, {
            creatorId: uid,
            creatorName: context.auth?.token.name || 'Anonymous',
            matchTitle,
            entryFee,
            maxPlayers,
            privacy,
            timeLimit,
            status: 'waiting',
            players: [uid],
            playerInfo: {
                [uid]: {
                    name: context.auth?.token.name || 'Anonymous',
                    photoURL: context.auth?.token.picture || '',
                    isReady: true,
                }
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const transactionRef = db.collection('transactions').doc();
        transaction.set(transactionRef, {
            userId: uid,
            amount: entryFee,
            type: 'debit',
            reason: 'match_creation',
            status: 'completed',
            matchId: matchId,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return { status: 'success', message: 'Match created successfully.', matchId: matchId };
    });
});
