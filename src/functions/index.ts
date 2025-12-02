
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

        // More detailed user stats
        let activeUsers = 0;
        let suspendedUsers = 0;
        let newToday = 0;
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        usersSnapshot.docs.forEach(doc => {
            const user = doc.data();
            if (user.status === 'active') activeUsers++;
            if (user.status === 'suspended') suspendedUsers++;
            if (user.createdAt.toDate() > oneDayAgo) newToday++;
        });

        // Financial stats
        const totalCommission = matchesSnapshot.docs.reduce((sum, doc) => sum + (doc.data().commission || 0), 0);
        const winningsPaidSnapshot = await db.collectionGroup("transactions").where("reason", "==", "match_win").get();
        const totalWinnings = winningsPaidSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);

        // Chart data for the last 7 days
        const chartData: any[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            chartData.push({ date: dateStr, "New Users": 0, "Revenue": 0 });
        }

        usersSnapshot.docs.forEach(doc => {
            const user = doc.data();
            const dateStr = user.createdAt.toDate().toISOString().split('T')[0];
            const day = chartData.find(d => d.date === dateStr);
            if (day) day["New Users"]++;
        });

        const revenueSnapshot = await db.collectionGroup('transactions').where('reason', '==', 'admin_commission').get();
        revenueSnapshot.docs.forEach(doc => {
            const revenue = doc.data();
            const dateStr = revenue.timestamp.toDate().toISOString().split('T')[0];
            const day = chartData.find(d => d.date === dateStr);
            if (day) day["Revenue"] += revenue.amount;
        });


        return {
            stats: {
                totalUsers: usersSnapshot.size,
                activeUsers,
                suspendedUsers,
                newToday,
                activeMatches: matchesSnapshot.docs.filter(doc => doc.data().status === "inprogress").length,
                completedMatches: matchesSnapshot.docs.filter(doc => doc.data().status === "completed").length,
                pendingDeposits: depositsSnapshot.size,
                pendingWithdrawals: withdrawalsSnapshot.size,
                totalCommission,
                totalWinnings,
            },
            chartData,
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
    
     // Also save/update the UPI ID to the user's profile for future use
    const userRef = db.collection('users').doc(uid);
    await userRef.update({ upiId: upiId });

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
        t.update(requestRef, { status: newStatus, processedBy: context.auth?.uid, processedAt: admin.firestore.FieldValue.serverTimestamp() });

        // If rejecting, we need to refund the user's winningBalance
        if (!approve) {
            const walletRef = db.collection('wallets').doc(requestData.userId);
            t.update(walletRef, { winningBalance: admin.firestore.FieldValue.increment(requestData.amount) });
        }
        
        // Log transaction for both approved and rejected
        const transactionRef = db.collection(`users/${requestData.userId}/transactions`).doc();
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

    if (!matchId) {
        throw new functions.https.HttpsError('invalid-argument', 'A match ID is required.');
    }

    // Check user's active match count
    const activeMatchesQuery = db.collection('matches')
        .where('players', 'array-contains', uid)
        .where('status', 'in', ['waiting', 'inprogress']);
    
    const activeMatchesSnap = await activeMatchesQuery.get();

    if (activeMatchesSnap.size >= 3) {
        throw new functions.https.HttpsError('failed-precondition', 'You can only have a maximum of 3 active matches.');
    }
    
    const walletRef = db.collection('wallets').doc(uid);
    const matchRef = db.collection('matches').doc(matchId);
    
    return db.runTransaction(async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Wallet not found.');
        }
        
        const walletData = walletDoc.data()!;
        const totalBalance = (walletData.depositBalance || 0) + (walletData.winningBalance || 0);

        if (totalBalance < entryFee) {
            throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance to create match.');
        }
        
        let newDepositBalance = walletData.depositBalance || 0;
        let newWinningBalance = walletData.winningBalance || 0;

        if (newDepositBalance >= entryFee) {
            newDepositBalance -= entryFee;
        } else {
            const remainingFee = entryFee - newDepositBalance;
            newDepositBalance = 0;
            newWinningBalance -= remainingFee;
        }

        transaction.update(walletRef, { 
            depositBalance: newDepositBalance,
            winningBalance: newWinningBalance,
        });

        transaction.set(matchRef, {
            createdBy: uid,
            creatorName: context.auth?.token.name || 'Anonymous',
            matchTitle: matchTitle || `Match by ${context.auth?.token.name}`,
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
                    isReady: false, 
                }
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const transactionRef = db.collection(`users/${uid}/transactions`).doc();
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

export const processDepositRequest = regionalFunctions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { requestId, action } = data; // 'action' is 'approve' or 'reject'

    if (!requestId || !['approve', 'reject'].includes(action)) {
        throw new functions.https.HttpsError("invalid-argument", "Request ID and a valid action are required.");
    }

    const requestRef = db.collection("depositRequests").doc(requestId);
    return db.runTransaction(async (transaction) => {
        const requestDoc = await transaction.get(requestRef);
        if (!requestDoc.exists || requestDoc.data()?.status !== 'pending') {
            throw new functions.https.HttpsError("not-found", "Pending deposit request not found.");
        }

        const requestData = requestDoc.data()!;
        if (action === 'approve') {
            const userWalletRef = db.collection("wallets").doc(requestData.userId);
            transaction.update(userWalletRef, { depositBalance: admin.firestore.FieldValue.increment(requestData.amount) });
            
            // Create a record in the user's 'transactions' sub-collection
            const userTransactionRef = db.collection(`users/${requestData.userId}/transactions`).doc();
            transaction.set(userTransactionRef, { 
                userId: requestData.userId,
                amount: requestData.amount, 
                reason: "deposit", 
                type: 'credit',
                status: 'completed',
                depositId: requestId, 
                timestamp: admin.firestore.FieldValue.serverTimestamp() 
            });
            
            transaction.update(requestRef, { status: "approved", processedBy: context.auth?.uid });
        } else {
            transaction.update(requestRef, { status: "rejected", processedBy: context.auth?.uid });
        }
        return { status: "success", message: `Request ${action}ed.` };
    });
});

export const distributeWinnings = regionalFunctions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { matchId, winnerId } = data;

    const matchRef = db.collection('matches').doc(matchId);

    return db.runTransaction(async (transaction) => {
        const matchDoc = await transaction.get(matchRef);
        if (!matchDoc.exists) throw new Error("Match not found");

        const match = matchDoc.data()!;
        if (match.status !== 'inprogress') throw new Error("Match is not in progress");

        const prizePool = match.entryFee * match.players.length;
        const commission = prizePool * 0.1;
        const winnings = prizePool - commission;

        transaction.update(matchRef, {
            status: 'completed',
            winner: winnerId,
            winnings,
            commission
        });
        
        const winnerWalletRef = db.collection('wallets').doc(winnerId);
        transaction.update(winnerWalletRef, { winningBalance: admin.firestore.FieldValue.increment(winnings) });
        
        const winTxRef = db.collection(`users/${winnerId}/transactions`).doc();
        transaction.set(winTxRef, {
            userId: winnerId,
            amount: winnings,
            type: 'credit',
            reason: 'match_win',
            status: 'completed',
            matchId: matchId,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        const commissionTxRef = db.collection('transactions').doc(); // Storing admin commission in a separate collection for analytics
        transaction.set(commissionTxRef, {
            userId: 'admin', 
            amount: commission,
            type: 'credit',
            reason: 'admin_commission',
            status: 'completed',
            matchId: matchId,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return { status: 'success', message: `Winnings distributed to ${winnerId}` };
    });
});

export const cancelMatchByAdmin = regionalFunctions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { matchId } = data;
    const matchRef = db.collection('matches').doc(matchId);

    return db.runTransaction(async (t) => {
        const matchDoc = await t.get(matchRef);
        if (!matchDoc.exists) throw new Error("Match not found");

        const match = matchDoc.data()!;
        if (match.status === 'completed' || match.status === 'cancelled') {
            throw new Error('Match is already finalized.');
        }

        t.update(matchRef, { status: 'cancelled' });

        for (const playerId of match.players) {
            const walletRef = db.collection('wallets').doc(playerId);
            const txRef = db.collection(`users/${playerId}/transactions`).doc();
            
            // Refund the entry fee to the deposit balance
            t.update(walletRef, { depositBalance: admin.firestore.FieldValue.increment(match.entryFee) });
            
            // Log the refund transaction
            t.set(txRef, {
                userId: playerId,
                amount: match.entryFee,
                type: 'credit',
                reason: 'match_cancellation_refund',
                status: 'completed',
                matchId: matchId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        return { status: 'success', message: 'Match cancelled and players refunded.' };
    });
});

export const manageAdminRole = regionalFunctions.https.onCall(async (data, context) => {
  await ensureAdmin(context);

  const { uid, action } = data;
  if (!uid || !action || !['grant', 'revoke'].includes(action)) {
    throw new functions.https.HttpsError('invalid-argument', 'UID and action (grant/revoke) are required.');
  }

  if (uid === context.auth?.uid) {
      throw new functions.https.HttpsError('failed-precondition', 'Admins cannot change their own role.');
  }

  const adminRoleRef = db.collection('roles_admin').doc(uid);

  try {
    if (action === 'grant') {
      await adminRoleRef.set({ grantedAt: admin.firestore.FieldValue.serverTimestamp(), grantedBy: context.auth?.uid });
      return { message: `Successfully granted admin role to user ${uid}.` };
    } else { // revoke
      await adminRoleRef.delete();
      return { message: `Successfully revoked admin role for user ${uid}.` };
    }
  } catch (error) {
    console.error(`Failed to ${action} admin role for ${uid}`, error);
    throw new functions.https.HttpsError('internal', `An error occurred while trying to ${action} the admin role.`);
  }
});


export const analyzeStorage = regionalFunctions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const bucket = admin.storage().bucket();
    
    try {
        const [files] = await bucket.getFiles();
        let totalSize = 0;
        const fileDetails = files.map(file => {
            const size = parseInt(file.metadata.size as string, 10);
            totalSize += size;
            return {
                name: file.name,
                size: (size / 1024).toFixed(2) + ' KB',
            };
        });

        return {
            totalSize: (totalSize / (1024 * 1024)).toFixed(2) + ' MB',
            fileCount: files.length,
            files: fileDetails
        };
    } catch (error) {
        console.error('Error analyzing storage:', error);
        throw new functions.httpss.HttpsError('internal', 'Failed to analyze storage bucket.');
    }
});
