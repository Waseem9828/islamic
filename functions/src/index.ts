
import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// =====================================================================
// Helper Functions
// =====================================================================

const isAdmin = async (uid: string): Promise<boolean> => {
  if (!uid) return false;
  try {
    const adminDoc = await db.collection("roles_admin").doc(uid).get();
    return adminDoc.exists;
  } catch (error) {
    logger.error(`Error checking admin status for UID: ${uid}`, error);
    return false;
  }
};

const ensureAuthenticated = (context: { auth?: { uid: string } }) => {
  if (!context.auth) {
    logger.error("Authentication check failed: user not authenticated.");
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
};

const ensureAdmin = async (context: { auth?: { uid: string } }) => {
  ensureAuthenticated(context);
  const userIsAdmin = await isAdmin(context.auth!.uid);
  if (!userIsAdmin) {
    logger.error("Admin check failed: user is not an admin.", { uid: context.auth!.uid });
    throw new HttpsError("permission-denied", "This function must be called by an admin.");
  }
};

// =====================================================================
// USER-FACING Callable Functions
// =====================================================================

const region = "us-east1";

export const requestDeposit = onCall({ region, cors: true }, async (request) => {
  ensureAuthenticated(request);
  const { amount, transactionId, screenshotUrl } = request.data;
  const uid = request.auth!.uid;

  if (!amount || typeof amount !== 'number' || amount <= 0 || !transactionId || !screenshotUrl) {
    throw new HttpsError("invalid-argument", "Valid amount, transaction ID, and screenshot URL are required.");
  }

  const depositRequest = {
    userId: uid,
    amount,
    transactionId,
    screenshotUrl,
    status: "pending",
    requestedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await db.collection("depositRequests").add(depositRequest);
  return { status: "success", message: "Your deposit request has been submitted." };
});

export const requestWithdrawal = onCall({ region, cors: true }, async (request) => {
    ensureAuthenticated(request);
    const { amount, upiId } = request.data;
    const uid = request.auth!.uid;

    if (!amount || typeof amount !== 'number' || amount <= 0 || !upiId) {
        throw new HttpsError("invalid-argument", "A valid amount and UPI ID are required.");
    }

    const walletRef = db.collection("wallets").doc(uid);
    const userRef = db.collection('users').doc(uid);

    return db.runTransaction(async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists) {
            throw new HttpsError("not-found", "User wallet not found.");
        }
        const walletData = walletDoc.data()!;
        if (walletData.winningBalance < amount) {
            throw new HttpsError("failed-precondition", "Insufficient winning balance.");
        }

        // Update user's UPI ID
        transaction.update(userRef, { upiId: upiId });

        // Decrement winning balance
        transaction.update(walletRef, { winningBalance: admin.firestore.FieldValue.increment(-amount) });

        // Create withdrawal request
        const withdrawalRequestRef = db.collection("withdrawalRequests").doc();
        transaction.set(withdrawalRequestRef, {
            userId: uid,
            amount,
            upiId,
            status: "pending",
            requestedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { status: "success", message: "Withdrawal request submitted." };
    });
});

export const createMatch = onCall({ region, cors: true }, async (request) => {
    ensureAuthenticated(request);
    const { matchId, matchTitle, entryFee, maxPlayers, privacy, timeLimit } = request.data;
    const uid = request.auth!.uid;

    if (!matchId || !matchTitle || !entryFee || !maxPlayers || !privacy || !timeLimit) {
      throw new HttpsError("invalid-argument", "Missing required match parameters.");
    }
  
    const walletRef = db.collection("wallets").doc(uid);
    const matchRef = db.collection("matches").doc(matchId);
    const activeMatchesQuery = db.collection('matches').where('players', 'array-contains', uid).where('status', 'in', ['waiting', 'inprogress']);
  
    return db.runTransaction(async (transaction) => {
        const activeMatchesSnap = await transaction.get(activeMatchesQuery);
        if (activeMatchesSnap.size >= 3) {
            throw new HttpsError('failed-precondition', 'You can only have a maximum of 3 active matches.');
        }

        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists) throw new HttpsError("not-found", "User wallet does not exist.");

        const walletData = walletDoc.data()!;
        if ((walletData.depositBalance + walletData.winningBalance) < entryFee) {
            throw new HttpsError("failed-precondition", "Insufficient funds.");
        }

        const winningDeduction = Math.min(walletData.winningBalance, entryFee);
        const depositDeduction = entryFee - winningDeduction;

        transaction.set(matchRef, { 
            matchTitle: matchTitle || `Match ${matchId}`, 
            entryFee, 
            maxPlayers,
            privacy,
            timeLimit,
            createdBy: uid, 
            creatorName: request.auth?.token.name || 'Anonymous',
            players: [uid], 
            status: "waiting", 
            playerInfo: {
                [uid]: {
                    name: request.auth?.token.name || 'Anonymous',
                    photoURL: request.auth?.token.picture || '',
                    isReady: false, 
                }
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp() 
        });
        transaction.update(walletRef, { winningBalance: admin.firestore.FieldValue.increment(-winningDeduction), depositBalance: admin.firestore.FieldValue.increment(-depositDeduction) });
        
        const userTransactionRef = db.collection(`users/${uid}/transactions`).doc();
        transaction.set(userTransactionRef, { amount: -entryFee, reason: "match_entry", matchId, timestamp: admin.firestore.FieldValue.serverTimestamp() });
        
        return { status: "success", message: "Match created successfully.", matchId };
    });
});

export const joinMatch = onCall({ region, cors: true }, async (request) => {
    ensureAuthenticated(request);
    const { matchId } = request.data;
    const uid = request.auth!.uid;

    if (!matchId) throw new HttpsError("invalid-argument", "Match ID is required.");

    const walletRef = db.collection("wallets").doc(uid);
    const matchRef = db.collection("matches").doc(matchId);
    const activeMatchesQuery = db.collection('matches').where('players', 'array-contains', uid).where('status', 'in', ['waiting', 'inprogress']);

    return db.runTransaction(async (transaction) => {
        const activeMatchesSnap = await transaction.get(activeMatchesQuery);
        if (activeMatchesSnap.size >= 3) {
            throw new HttpsError('failed-precondition', 'You can only have a maximum of 3 active matches.');
        }

        const matchDoc = await transaction.get(matchRef);
        const walletDoc = await transaction.get(walletRef);

        if (!matchDoc.exists) throw new HttpsError("not-found", "Match not found.");
        if (!walletDoc.exists) throw new HttpsError("not-found", "User wallet not found.");

        const matchData = matchDoc.data()!;
        const walletData = walletDoc.data()!;

        if (matchData.status !== 'waiting') throw new HttpsError("failed-precondition", "Match not open for joining.");
        if (matchData.players.includes(uid)) throw new HttpsError("failed-precondition", "You already joined.");

        const { entryFee } = matchData;
        if ((walletData.depositBalance + walletData.winningBalance) < entryFee) {
            throw new HttpsError("failed-precondition", "Insufficient funds.");
        }

        const winningDeduction = Math.min(walletData.winningBalance, entryFee);
        const depositDeduction = entryFee - winningDeduction;

        transaction.update(walletRef, { winningBalance: admin.firestore.FieldValue.increment(-winningDeduction), depositBalance: admin.firestore.FieldValue.increment(-depositDeduction) });
        transaction.update(matchRef, { players: admin.firestore.FieldValue.arrayUnion(uid) });

        const userTransactionRef = db.collection(`users/${uid}/transactions`).doc();
        transaction.set(userTransactionRef, { amount: -entryFee, reason: "match_entry", matchId, timestamp: admin.firestore.FieldValue.serverTimestamp() });

        return { status: "success", message: "Successfully joined match." };
    });
});

export const submitResult = onCall({ region, cors: true, maxInstances: 10 }, async (request) => {
    ensureAuthenticated(request);
    const { matchId, selectedPosition, screenshotBase64, prize } = request.data;
    const uid = request.auth!.uid;

    if (!matchId || !selectedPosition || !screenshotBase64 || !prize) {
        throw new HttpsError("invalid-argument", "Missing required result data.");
    }

    const matchRef = db.collection("matches").doc(matchId);
    const matchDoc = await matchRef.get();

    if (!matchDoc.exists) throw new HttpsError("not-found", "Match not found.");
    const matchData = matchDoc.data()!;

    if (!matchData.players.includes(uid)) throw new HttpsError("permission-denied", "You are not a player in this match.");
    if (matchData.status !== 'inprogress') throw new HttpsError("failed-precondition", "Match is not in progress.");
    if (matchData.results && matchData.results[uid]) throw new HttpsError("failed-precondition", "You have already submitted a result.");

    const bucket = storage.bucket();
    const fileName = `results/${matchId}/${uid}/${Date.now()}.jpg`;
    const file = bucket.file(fileName);
    const buffer = Buffer.from(screenshotBase64, 'base64');

    await file.save(buffer, { contentType: 'image/jpeg' });
    const [screenshotUrl] = await file.getSignedUrl({ action: 'read', expires: '03-09-2491' });

    const resultData = {
        position: parseInt(selectedPosition),
        screenshotUrl,
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'Pending Verification',
        estimatedWinnings: prize,
    };

    await matchRef.update({ [`results.${uid}`]: resultData });

    return { status: "success", message: "Result submitted successfully!" };
});

export const declareMatchWinner = onCall({ region, cors: true }, async (request) => {
    ensureAuthenticated(request);
    const { matchId, winnerId } = request.data;
    const uid = request.auth!.uid;

    if (!matchId || !winnerId) throw new HttpsError("invalid-argument", "Match ID and Winner ID are required.");

    const matchRef = db.collection("matches").doc(matchId);
    
    return db.runTransaction(async (transaction) => {
        const matchDoc = await transaction.get(matchRef);
        if (!matchDoc.exists) throw new HttpsError("not-found", "Match not found.");
        
        const matchData = matchDoc.data()!;
        const userIsAdmin = await isAdmin(uid);
        if (matchData.hostId !== uid && !userIsAdmin) {
            throw new HttpsError("permission-denied", "Only the host or an admin can declare the winner.");
        }

        if (matchData.status !== 'waiting') throw new HttpsError("failed-precondition", "Match already completed or canceled.");
        if (!matchData.players.includes(winnerId)) throw new HttpsError("not-found", "Winner is not a player in this match.");

        const prizePool = matchData.players.length * matchData.entryFee;
        const winnerWalletRef = db.collection("wallets").doc(winnerId);

        transaction.update(winnerWalletRef, { winningBalance: admin.firestore.FieldValue.increment(prizePool) });
        transaction.update(matchRef, { status: "completed", winnerId, completedAt: admin.firestore.FieldValue.serverTimestamp() });

        const winnerTransactionRef = db.collection(`users/${winnerId}/transactions`).doc();
        transaction.set(winnerTransactionRef, { amount: prizePool, reason: "match_win", matchId, timestamp: admin.firestore.FieldValue.serverTimestamp() });
        
        return { status: "success", message: "Winner declared successfully." };
    });
});

export const getUserTransactions = onCall({ region, cors: true }, async (request) => {
    ensureAuthenticated(request);
    const uid = request.auth!.uid;
    const transactionsSnap = await db.collection(`users/${uid}/transactions`).orderBy("timestamp", "desc").get();
    return transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

// =====================================================================
// ADMIN-FACING Callable Functions
// =====================================================================

export const checkAdminStatus = onCall({ region, cors: true }, async (request) => {
  ensureAuthenticated(request);
  return { isAdmin: await isAdmin(request.auth!.uid) };
});

export const processDepositRequest = onCall({ region, cors: true }, async (request) => {
    await ensureAdmin(request);
    const { requestId, action } = request.data;

    if (!requestId || !['approve', 'reject'].includes(action)) {
        throw new HttpsError("invalid-argument", "Request ID and a valid action are required.");
    }

    const requestRef = db.collection("depositRequests").doc(requestId);
    return db.runTransaction(async (transaction) => {
        const requestDoc = await transaction.get(requestRef);
        if (!requestDoc.exists || requestDoc.data()?.status !== 'pending') {
            throw new HttpsError("not-found", "Pending deposit request not found.");
        }

        const requestData = requestDoc.data()!;
        if (action === 'approve') {
            const userWalletRef = db.collection("wallets").doc(requestData.userId);
            transaction.update(userWalletRef, { depositBalance: admin.firestore.FieldValue.increment(requestData.amount) });
            
            const userTransactionRef = db.collection(`users/${requestData.userId}/transactions`).doc();
            transaction.set(userTransactionRef, { 
                amount: requestData.amount, 
                reason: "deposit",
                type: 'credit',
                status: 'completed',
                depositId: requestId, 
                timestamp: admin.firestore.FieldValue.serverTimestamp() 
            });
            
            transaction.update(requestRef, { status: "approved" });
        } else {
            transaction.update(requestRef, { status: "rejected" });
        }
        return { status: "success", message: `Request ${action}ed.` };
    });
});

export const processWithdrawalRequest = onCall({ region, cors: true }, async (request) => {
    await ensureAdmin(request);
    const { requestId, action } = request.data;

    if (!requestId || !['approve', 'reject'].includes(action)) {
        throw new HttpsError("invalid-argument", "Request ID and action are required.");
    }

    const requestRef = db.collection("withdrawalRequests").doc(requestId);
    return db.runTransaction(async (transaction) => {
        const requestDoc = await transaction.get(requestRef);
        if (!requestDoc.exists || requestDoc.data()?.status !== 'pending') {
            throw new HttpsError("not-found", "Pending withdrawal request not found.");
        }
        const requestData = requestDoc.data()!;
        if (action === 'approve') {
            const userTransactionRef = db.collection(`users/${requestData.userId}/transactions`).doc();
            transaction.set(userTransactionRef, { amount: -requestData.amount, reason: "withdrawal_approved", withdrawalId: requestId, timestamp: admin.firestore.FieldValue.serverTimestamp() });
            transaction.update(requestRef, { status: "approved" });
        } else {
            const userWalletRef = db.collection("wallets").doc(requestData.userId);
            transaction.update(userWalletRef, { winningBalance: admin.firestore.FieldValue.increment(requestData.amount) });
            transaction.update(requestRef, { status: "rejected" });
        }
        return { status: "success", message: `Request ${action}ed.` };
    });
});

export const getAllUsers = onCall({ region, cors: true }, async (request) => {
    await ensureAdmin(request);
    const usersSnap = await admin.auth().listUsers();
    return usersSnap.users.map(user => user.toJSON());
});

export const getAllMatches = onCall({ region, cors: true }, async (request) => {
    await ensureAdmin(request);
    const matchesSnap = await db.collection("matches").orderBy("createdAt", "desc").get();
    return matchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

export const cancelMatch = onCall({ region, cors: true }, async (request) => {
    await ensureAdmin(request);
    const { matchId } = request.data;
    if (!matchId) throw new HttpsError("invalid-argument", "Match ID is required.");

    const matchRef = db.collection("matches").doc(matchId);
    return db.runTransaction(async (transaction) => {
        const matchDoc = await transaction.get(matchRef);
        if (!matchDoc.exists) throw new HttpsError("not-found", "Match not found.");
        const matchData = matchDoc.data()!;
        if (matchData.status !== 'waiting') throw new HttpsError("failed-precondition", "Only a waiting match can be canceled.");

        const { entryFee } = matchData;
        for (const playerId of matchData.players) {
            const playerWalletRef = db.collection("wallets").doc(playerId);
            transaction.update(playerWalletRef, { depositBalance: admin.firestore.FieldValue.increment(entryFee) });
            
            const userTransactionRef = db.collection(`users/${playerId}/transactions`).doc();
            transaction.set(userTransactionRef, { amount: entryFee, reason: "match_canceled_refund", matchId, timestamp: admin.firestore.FieldValue.serverTimestamp() });
        }
        transaction.update(matchRef, { status: "canceled", completedAt: admin.firestore.FieldValue.serverTimestamp() });
        return { status: "success", message: "Match canceled and players refunded." };
    });
});

export const adjustUserWallet = onCall({ region, cors: true }, async (request) => {
    await ensureAdmin(request);
    const { userId, amount, balanceType, reason } = request.data;

    if (!userId || !amount || !balanceType || !reason) {
        throw new HttpsError("invalid-argument", "User ID, amount, balance type, and reason are required.");
    }
    if (!['depositBalance', 'winningBalance', 'bonusBalance'].includes(balanceType)) {
        throw new HttpsError("invalid-argument", "Invalid balance type.");
    }

    const walletRef = db.collection("wallets").doc(userId);
    await walletRef.update({ [balanceType]: admin.firestore.FieldValue.increment(amount) });
    
    const transactionRef = db.collection(`users/${userId}/transactions`).doc();
    await transactionRef.set({ amount, reason: `admin_adjustment: ${reason}`, timestamp: admin.firestore.FieldValue.serverTimestamp() });
    
    return { success: true };
});

export const getAdminDashboardStats = onCall({ region, cors: true }, async (request) => {
  await ensureAdmin(request);
  const usersSnapshot = await db.collection("users").get();
  const matchesSnapshot = await db.collection("matches").get();
  const depositsSnapshot = await db.collection("depositRequests").where("status", "==", "pending").get();
  const withdrawalsSnapshot = await db.collection("withdrawalRequests").where("status", "==", "pending").get();
  
  return {
      totalUsers: usersSnapshot.size,
      activeMatches: matchesSnapshot.docs.filter(doc => doc.data().status === "inprogress").length,
      pendingDeposits: depositsSnapshot.size,
      pendingWithdrawals: withdrawalsSnapshot.size,
  };
});
