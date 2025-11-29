
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v1/https";

admin.initializeApp();
const db = admin.firestore();
const regionalFunctions = functions.region("us-east1");

// =====================================================================
//  Helper Functions
// =====================================================================

const isAdmin = async (uid: string): Promise<boolean> => {
    if (!uid) return false;
    const adminDoc = await db.collection("roles_admin").doc(uid).get();
    return adminDoc.exists;
};

const ensureAdmin = async (context: functions.https.CallableContext) => {
    if (!context.auth) {
        throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    if (!(await isAdmin(context.auth.uid))) {
        throw new HttpsError("permission-denied", "User is not an admin.");
    }
};

const ensureAuthenticated = (context: functions.https.CallableContext) => {
    if (!context.auth) {
        throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    return context.auth.uid;
};


// =====================================================================
//  Callable Functions
// =====================================================================

export const checkAdminStatus = regionalFunctions.https.onCall(async (_, context) => {
    const uid = ensureAuthenticated(context);
    const userIsAdmin = await isAdmin(uid);
    return { isAdmin: userIsAdmin };
});

export const getAdminDashboardStats = regionalFunctions.https.onCall(async (_, context) => {
    await ensureAdmin(context);

    try {
        const usersSnapshot = await db.collection("users").get();
        const matchesSnapshot = await db.collection("matches").get();
        const depositsSnapshot = await db.collection("depositRequests").where("status", "==", "pending").get();
        const withdrawalsSnapshot = await db.collection("withdrawalRequests").where("status", "==", "pending").get();
        
        let totalCommission = 0;
        let completedMatches = 0;
        matchesSnapshot.docs.forEach(doc => {
            const match = doc.data();
            if (match.status === 'completed' && match.commission) {
                totalCommission += match.commission;
                completedMatches++;
            }
        });
        
        const winningsPaidSnapshot = await db.collection("transactions").where("reason", "==", "match_win").get();
        const totalWinnings = winningsPaidSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);

        const activeUsers = (await db.collection("users").where("status", "==", "active").get()).size;
        const suspendedUsers = (await db.collection("users").where("status", "==", "suspended").get()).size;
        
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        const newToday = (await db.collection("users").where("createdAt", ">=", twentyFourHoursAgo).get()).size;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const chartDataPromises = Array.from({ length: 7 }).map(async (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const startOfDay = new Date(d.setHours(0, 0, 0, 0));
            const endOfDay = new Date(d.setHours(23, 59, 59, 999));
            
            const revenueSnap = await db.collection('transactions').where('reason', '==', 'match_commission').where('timestamp', '>=', startOfDay).where('timestamp', '<=', endOfDay).get();
            const revenue = revenueSnap.docs.reduce((sum, doc) => sum + doc.data().amount, 0);

            const usersSnap = await db.collection('users').where('createdAt', '>=', startOfDay).where('createdAt', '<=', endOfDay).get();
            const newUsers = usersSnap.size;

            return { date: dateStr, 'Revenue': revenue, 'New Users': newUsers };
        });
        
        const chartData = (await Promise.all(chartDataPromises)).reverse();

        return {
          stats: {
            totalUsers: usersSnapshot.size,
            activeUsers: activeUsers,
            suspendedUsers: suspendedUsers,
            newToday: newToday,
            activeMatches: matchesSnapshot.docs.filter(doc => doc.data().status === "inprogress").length,
            completedMatches: completedMatches,
            pendingDeposits: depositsSnapshot.size,
            pendingWithdrawals: withdrawalsSnapshot.size,
            totalCommission: totalCommission,
            totalWinnings: totalWinnings,
          },
          chartData: chartData
        };
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw new functions.https.HttpsError("internal", "Could not fetch dashboard statistics.");
    }
});

export const updateUserStatus = regionalFunctions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { uid, status } = data;
    if (!uid || !["active", "suspended"].includes(status)) {
        throw new HttpsError("invalid-argument", "Invalid UID or status provided.");
    }
    await db.collection("users").doc(uid).update({ status });
    return { success: true, message: `User ${uid} status updated to ${status}.` };
});

export const getWalletInfo = regionalFunctions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { uid } = data;
    if (!uid) {
        throw new HttpsError("invalid-argument", "Invalid UID provided.");
    }
    const walletDoc = await db.collection("wallets").doc(uid).get();
    if (!walletDoc.exists) {
        return { depositBalance: 0, winningBalance: 0, bonusBalance: 0 };
    }
    const walletData = walletDoc.data()!;
    return {
        depositBalance: walletData.depositBalance || 0,
        winningBalance: walletData.winningBalance || 0,
        bonusBalance: walletData.bonusBalance || 0,
    };
});

export const requestDeposit = regionalFunctions.https.onCall(async (data, context) => {
  const uid = ensureAuthenticated(context);
  const { amount, transactionId, screenshotUrl } = data;
  if (!amount || typeof amount !== 'number' || amount <= 0 || !transactionId || !screenshotUrl) {
      throw new HttpsError("invalid-argument", "Amount, transaction ID, and screenshot URL are required.");
  }
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
});

export const requestWithdrawal = regionalFunctions.https.onCall(async (data, context) => {
    const uid = ensureAuthenticated(context);
    const { amount, upiId } = data;

    if (!amount || typeof amount !== 'number' || amount <= 0 || !upiId) {
        throw new HttpsError("invalid-argument", "Valid amount and UPI ID are required.");
    }

    const walletRef = db.collection('wallets').doc(uid);
    const minWithdrawalAmount = (await db.collection('settings').doc('rules').get()).data()?.minWithdrawalAmount || 100;

    if (amount < minWithdrawalAmount) {
         throw new HttpsError('failed-precondition', `Minimum withdrawal amount is ₹${minWithdrawalAmount}.`);
    }

    return db.runTransaction(async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists || walletDoc.data()!.winningBalance < amount) {
            throw new HttpsError('failed-precondition', 'Insufficient winning balance.');
        }

        const newWinningBalance = walletDoc.data()!.winningBalance - amount;
        transaction.update(walletRef, { winningBalance: newWinningBalance });

        const withdrawalReqRef = db.collection('withdrawalRequests').doc();
        transaction.set(withdrawalReqRef, {
            userId: uid,
            amount,
            upiId,
            status: 'pending',
            requestedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        const transactionRecordRef = db.collection('transactions').doc();
        transaction.set(transactionRecordRef, {
            userId: uid,
            amount: amount,
            type: 'debit',
            reason: 'withdrawal_request',
            status: 'pending',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            withdrawalId: withdrawalReqRef.id
        });

        return { result: { status: 'success', message: 'Withdrawal request submitted.'} };
    });
});

export const createMatch = regionalFunctions.https.onCall(async (data, context) => {
    const uid = ensureAuthenticated(context);
    const { matchId, matchTitle, entryFee, maxPlayers, privacy, timeLimit } = data;

    if (!matchId || !entryFee || !maxPlayers || !privacy || !timeLimit) {
        throw new HttpsError('invalid-argument', 'Missing required match details.');
    }
    
    const userDoc = await db.collection('users').doc(uid).get();
    const creatorName = userDoc.data()?.displayName || 'Anonymous';
    const creatorPhoto = userDoc.data()?.photoURL || '';

    const walletRef = db.collection('wallets').doc(uid);

    return db.runTransaction(async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        const totalBalance = (walletDoc.data()?.depositBalance || 0) + (walletDoc.data()?.winningBalance || 0);
        if (!walletDoc.exists || totalBalance < entryFee) {
            throw new HttpsError('failed-precondition', 'Insufficient balance to create match.');
        }
        
        let newDepositBalance = walletDoc.data()?.depositBalance || 0;
        let newWinningBalance = walletDoc.data()?.winningBalance || 0;

        if (newDepositBalance >= entryFee) {
            newDepositBalance -= entryFee;
        } else {
            const remainder = entryFee - newDepositBalance;
            newDepositBalance = 0;
            newWinningBalance -= remainder;
        }

        transaction.update(walletRef, { 
            depositBalance: newDepositBalance,
            winningBalance: newWinningBalance
        });

        const matchRef = db.collection('matches').doc(matchId);
        transaction.set(matchRef, {
            matchTitle,
            entryFee,
            maxPlayers,
            privacy,
            timeLimit,
            status: 'waiting',
            createdBy: uid,
            creatorName,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            players: [uid],
            playerInfo: {
                [uid]: { name: creatorName, photoURL: creatorPhoto, isReady: false }
            }
        });
        
        const transactionRecordRef = db.collection('transactions').doc();
        transaction.set(transactionRecordRef, {
            userId: uid,
            amount: entryFee,
            type: 'debit',
            reason: 'match_creation',
            status: 'completed',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            matchId: matchId
        });

        return { status: 'success', message: 'Match created and fee deducted.', matchId };
    });
});


export const processDeposit = regionalFunctions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { requestId, approve } = data;
    if (!requestId) {
        throw new HttpsError("invalid-argument", "Request ID is required.");
    }

    const requestRef = db.collection('depositRequests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists || requestDoc.data()?.status !== 'pending') {
        throw new HttpsError('not-found', 'Deposit request not found or already processed.');
    }

    const { userId, amount } = requestDoc.data()!;
    const walletRef = db.collection('wallets').doc(userId);
    const transactionRef = db.collection('transactions').doc();

    if (approve) {
        const bonusSettings = (await db.collection('settings').doc('rules').get()).data();
        let bonusAmount = 0;
        if (bonusSettings?.bonusEnabled && amount >= bonusSettings?.minDepositForBonus) {
             bonusAmount = Math.min(amount * (bonusSettings?.depositBonusRate || 0), bonusSettings?.maxBonus || 0);
        }

        await db.runTransaction(async (t) => {
            t.update(requestRef, { status: 'approved', processedAt: admin.firestore.FieldValue.serverTimestamp() });
            t.set(transactionRef, { userId, amount, type: 'credit', reason: 'deposit', status: 'approved', timestamp: admin.firestore.FieldValue.serverTimestamp() });
            t.update(walletRef, { 
                depositBalance: admin.firestore.FieldValue.increment(amount),
                bonusBalance: admin.firestore.FieldValue.increment(bonusAmount)
            });
        });
        return { status: 'success', message: `Deposit of ₹${amount} approved.` };
    } else {
        await requestRef.update({ status: 'rejected', processedAt: admin.firestore.FieldValue.serverTimestamp() });
        return { status: 'success', message: `Deposit request rejected.` };
    }
});


export const processWithdrawal = regionalFunctions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { requestId, approve } = data;
    if (!requestId) {
        throw new HttpsError("invalid-argument", "Request ID is required.");
    }
    const requestRef = db.collection('withdrawalRequests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists || requestDoc.data()?.status !== 'pending') {
        throw new HttpsError('not-found', 'Withdrawal request not found or already processed.');
    }
    
    const { userId, amount } = requestDoc.data()!;
    const walletRef = db.collection('wallets').doc(userId);
    
    const transQuery = await db.collection('transactions').where('withdrawalId', '==', requestId).limit(1).get();
    const transactionRef = transQuery.docs[0].ref;

    if (approve) {
        await db.runTransaction(async t => {
            t.update(requestRef, { status: 'approved', processedAt: admin.firestore.FieldValue.serverTimestamp() });
            t.update(transactionRef, { status: 'completed' });
            // The money was already debited from winnings balance when requested.
        });
        return { status: 'success', message: `Withdrawal of ₹${amount} approved.` };
    } else { // Reject
        await db.runTransaction(async t => {
            // Refund the winning balance
            t.update(walletRef, { winningBalance: admin.firestore.FieldValue.increment(amount) });
            t.update(requestRef, { status: 'rejected', processedAt: admin.firestore.FieldValue.serverTimestamp() });
            t.update(transactionRef, { status: 'cancelled' });
        });
        return { status: 'success', message: `Withdrawal of ₹${amount} rejected and refunded.` };
    }
});

export const manageAdminRole = regionalFunctions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { uid, action } = data;
    if (!uid || !action || !['grant', 'revoke'].includes(action)) {
        throw new HttpsError('invalid-argument', 'UID and a valid action (grant/revoke) are required.');
    }
    if (context.auth!.uid === uid) {
        throw new HttpsError('permission-denied', 'Admins cannot change their own role.');
    }

    const adminRoleRef = db.collection('roles_admin').doc(uid);
    const userRef = db.collection('users').doc(uid);

    if (action === 'grant') {
        await adminRoleRef.set({ grantedAt: admin.firestore.FieldValue.serverTimestamp() });
        await userRef.update({ isAdmin: true });
        return { message: `Successfully granted admin role to user ${uid}.` };
    } else { // revoke
        await adminRoleRef.delete();
        await userRef.update({ isAdmin: false });
        return { message: `Successfully revoked admin role from user ${uid}.` };
    }
});


export const analyzeStorage = regionalFunctions.https.onCall(async (_, context) => {
    await ensureAdmin(context);
    const [files] = await admin.storage().bucket().getFiles();
    
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
        files: fileDetails,
    };
});
