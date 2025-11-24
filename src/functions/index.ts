
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// Helper to get app rules with fallbacks
const getAppRules = async () => {
    const defaultRules = {
        adminCommissionRate: 0.10, cancellationFee: 5, minEntryFee: 50, depositBonusRate: 0.05
    };
    const rulesDoc = await db.collection('settings').doc('rules').get();
    if (!rulesDoc.exists) {
        console.warn("App settings not found! Using default values.");
        return defaultRules;
    }
    return { ...defaultRules, ...rulesDoc.data() };
};

const onCall = (handler) => {
    return functions.https.onCall(async (data, context) => {
        // Your custom logic here, e.g., authentication, logging
        if (!context.auth) {
            // Optionally handle unauthenticated requests
        }
        try {
            return await handler(data, context);
        } catch (error) {
            // Log and re-throw the error
            console.error("Unhandled error in onCall:", error);
            if (error instanceof functions.https.HttpsError) {
                throw error;
            }
            throw new functions.https.HttpsError("internal", "An unexpected error occurred.");
        }
    });
};

const ensureIsAdmin = async (context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Admin-only function.");
    }
    const adminDoc = await db.collection("roles_admin").doc(context.auth.uid).get();
    if (!adminDoc.exists) {
        throw new functions.https.HttpsError("permission-denied", "Admin-only function.");
    }
};

exports.checkAdminStatus = onCall(async (data, context) => {
    if (!context.auth) {
        return { isAdmin: false };
    }
    const { uid } = context.auth;
    const adminDoc = await db.collection("roles_admin").doc(uid).get();
    return { isAdmin: adminDoc.exists };
});


// --- Deposit Functions ---
exports.requestDeposit = onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");
    const { amount, transactionId, screenshotUrl } = data;
    if (!amount || typeof amount !== 'number' || amount <= 0) throw new functions.https.HttpsError('invalid-argument', 'Valid amount required.');
    if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length < 12) throw new functions.https.HttpsError('invalid-argument', 'Valid 12-digit Transaction ID required.');
    if (!screenshotUrl) throw new functions.https.HttpsError('invalid-argument', 'Screenshot is required.');

    await db.collection("depositRequests").add({
        userId: context.auth.uid, amount, transactionId: transactionId.trim(), screenshotUrl, status: 'pending', requestedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { status: "success", message: "Deposit request submitted." };
});

exports.processDeposit = onCall(async (data, context) => {
    await ensureIsAdmin(context);
    const { requestId, approve } = data;
    if (!requestId) throw new functions.https.HttpsError('invalid-argument', 'Request ID is required.');

    const requestRef = db.collection('depositRequests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Deposit request not found.');
    }
    if (requestDoc.data().status !== 'pending') {
        throw new functions.https.HttpsError('failed-precondition', 'Request has already been processed.');
    }

    const { userId, amount } = requestDoc.data();

    if (approve) {
        // --- Database Transaction ---
        await db.runTransaction(async (t) => {
            const rules = await getAppRules();
            const bonusAmount = amount * (rules.depositBonusRate || 0);

            const walletRef = db.collection('wallets').doc(userId);
            const walletDoc = await t.get(walletRef);

            if (!walletDoc.exists) {
                t.set(walletRef, {
                    depositBalance: amount,
                    bonusBalance: bonusAmount,
                    winningBalance: 0,
                    lifetimeBonus: bonusAmount
                });
            } else {
                t.update(walletRef, {
                    depositBalance: admin.firestore.FieldValue.increment(amount),
                    bonusBalance: admin.firestore.FieldValue.increment(bonusAmount),
                    lifetimeBonus: admin.firestore.FieldValue.increment(bonusAmount),
                });
            }

            t.update(requestRef, {
                status: 'approved',
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                processedBy: context.auth.uid
            });
        });
        // --- End Transaction ---

        // Create transaction record *after* the main transaction succeeds.
        const rules = await getAppRules();
        const bonusAmount = amount * (rules.depositBonusRate || 0);
        await db.collection('transactions').add({
            userId,
            type: 'credit',
            amount,
            reason: 'deposit',
            status: 'completed',
            depositId: requestId,
            bonus: bonusAmount,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        return { status: 'success', message: `Deposit of ₹${amount} approved.` };

    } else { // If rejecting
        await requestRef.update({
            status: 'rejected',
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            processedBy: context.auth.uid
        });
        return { status: 'success', message: "Request rejected." };
    }
});


// --- Match Functions ---
exports.createMatch = onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");
    
    const { matchId, matchTitle, entryFee, maxPlayers, privacy, timeLimit } = data;
    const { uid } = context.auth; // Correctly get UID
    const rules = await getAppRules();

    if (typeof matchId !== 'string' || matchId.length < 4) throw new functions.https.HttpsError("invalid-argument", "Invalid Match ID.");
    if (typeof entryFee !== 'number' || entryFee < rules.minEntryFee) throw new functions.https.HttpsError("invalid-argument", `Entry fee must be at least ₹${rules.minEntryFee}.`);

    const matchRef = db.collection("matches").doc(matchId.toUpperCase());
    const walletRef = db.collection("wallets").doc(uid);
    const userRef = db.collection("users").doc(uid); // Ref to user document

    return db.runTransaction(async (t) => {
        const [matchDoc, walletDoc, userDoc] = await Promise.all([
            t.get(matchRef),
            t.get(walletRef),
            t.get(userRef) // Get user doc in transaction
        ]);

        if (matchDoc.exists) throw new functions.https.HttpsError("already-exists", "Room code already exists.");
        if (!walletDoc.exists) throw new functions.https.HttpsError("not-found", "Wallet not found.");
        if (!userDoc.exists) throw new functions.https.HttpsError("not-found", "User profile not found.");

        const walletData = walletDoc.data();
        const userData = userDoc.data();
        const totalBalance = (walletData.depositBalance || 0) + (walletData.winningBalance || 0) + (walletData.bonusBalance || 0);
        
        if (totalBalance < entryFee) throw new functions.https.HttpsError("failed-precondition", "Insufficient total balance.");

        let remainingFee = entryFee;
        let deductedFromBonus = Math.min(remainingFee, walletData.bonusBalance || 0);
        remainingFee -= deductedFromBonus;
        let deductedFromDeposit = Math.min(remainingFee, walletData.depositBalance || 0);
        remainingFee -= deductedFromDeposit;
        let deductedFromWinnings = Math.min(remainingFee, walletData.winningBalance || 0);
        
        if (entryFee - (deductedFromBonus + deductedFromDeposit + deductedFromWinnings) > 0.01) throw new functions.https.HttpsError("failed-precondition", "Insufficient balance after detailed check.");

        t.update(walletRef, { 
            bonusBalance: admin.firestore.FieldValue.increment(-deductedFromBonus),
            depositBalance: admin.firestore.FieldValue.increment(-deductedFromDeposit),
            winningBalance: admin.firestore.FieldValue.increment(-deductedFromWinnings),
        });
        
        const creatorName = userData.displayName || "Anonymous";
        const creatorPhoto = userData.photoURL || null;

        t.set(matchRef, {
            id: matchId.toUpperCase(),
            room: matchId.toUpperCase(),
            matchTitle,
            entry: entryFee,
            maxPlayers,
            privacy,
            timeLimit,
            status: "waiting",
            createdBy: uid,
            creatorName: creatorName,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            players: [uid],
            playerInfo: {
                [uid]: {
                    name: creatorName,
                    photoURL: creatorPhoto,
                    isReady: false
                }
            },
        });
        
        t.set(db.collection("transactions").doc(), {
            userId: uid,
            type: "debit",
            amount: entryFee,
            reason: "match_creation",
            status: "completed",
            matchId: matchId.toUpperCase(),
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            breakdown: { fromDeposit: deductedFromDeposit, fromWinnings: deductedFromWinnings, fromBonus: deductedFromBonus }
        });
        
        return { status: "success", message: "Match created!", matchId: matchId.toUpperCase() };
    });
});

exports.cancelMatch = onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");
  const { matchId } = data;
  const userId = context.auth.uid;
  if (typeof matchId !== 'string' || matchId.length === 0) throw new functions.https.HttpsError("invalid-argument", "Invalid Match ID.");

  const matchRef = db.collection("matches").doc(matchId);
  const rules = await getAppRules();

  return db.runTransaction(async (t) => {
      const matchDoc = await t.get(matchRef);
      if (!matchDoc.exists) throw new functions.https.HttpsError("not-found", "Match not found.");
      const matchData = matchDoc.data();

      if (matchData.createdBy !== userId) throw new functions.https.HttpsError("permission-denied", "Only creator can cancel.");
      if (matchData.status !== "waiting" || matchData.players.length > 1) throw new functions.https.HttpsError("failed-precondition", "Cannot cancel now, other players have joined.");

      const creationTxQuery = await db.collection('transactions').where('userId', '==', userId).where('matchId', '==', matchId).where('reason', '==', 'match_creation').limit(1).get();
      if (creationTxQuery.empty) throw new functions.https.HttpsError("internal", "Cannot find original transaction for refund.");
      const { fromDeposit = 0, fromWinnings = 0, fromBonus = 0 } = creationTxQuery.docs[0].data().breakdown;

      const refundAmount = matchData.entry - rules.cancellationFee;
      t.update(db.collection('wallets').doc(userId), {
        depositBalance: admin.firestore.FieldValue.increment(Math.min(fromDeposit, refundAmount)),
        winningBalance: admin.firestore.FieldValue.increment(Math.min(fromWinnings, refundAmount - fromDeposit)),
        bonusBalance: admin.firestore.FieldValue.increment(Math.min(fromBonus, refundAmount - fromDeposit - fromWinnings)),
      });
      t.update(matchRef, { status: "cancelled" });
      t.set(db.collection("transactions").doc(), {
        userId, type: "credit", amount: refundAmount, reason: "match_cancellation_refund", matchId, timestamp: admin.firestore.FieldValue.serverTimestamp(), fee: rules.cancellationFee,
      });
      return { status: "success", message: `Match cancelled. ₹${refundAmount.toFixed(2)} refunded after a ₹${rules.cancellationFee} fee.` };
  });
});

exports.distributeWinnings = onCall(async (data, context) => {
    await ensureIsAdmin(context);
    const { matchId, winnerId } = data;
    if (!matchId || !winnerId) throw new functions.https.HttpsError('invalid-argument', 'matchId and winnerId required.');

    const matchRef = db.collection('matches').doc(matchId);
    const rules = await getAppRules();

    return db.runTransaction(async (t) => {
        const matchDoc = await t.get(matchRef);
        if (!matchDoc.exists) throw new functions.https.HttpsError('not-found', 'Match not found.');
        const matchData = matchDoc.data();
        if (matchData.status !== 'inprogress' && matchData.status !== 'waiting') throw new functions.https.HttpsError('failed-precondition', `Match is already ${matchData.status}.`);
        if (!matchData.players.includes(winnerId)) throw new functions.https.HttpsError('failed-precondition', 'Winner was not a player.');

        const totalPot = matchData.entry * matchData.players.length;
        const commission = totalPot * rules.adminCommissionRate;
        const winnings = totalPot - commission;

        t.update(db.collection('wallets').doc(winnerId), { winningBalance: admin.firestore.FieldValue.increment(winnings) });
        t.update(matchRef, { status: 'completed', winner: winnerId, winnings, commission });
        t.set(db.collection('transactions').doc(), {
            userId: winnerId, type: 'credit', amount: winnings, reason: 'match_win', matchId, status: 'completed', timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { status: 'success', message: `Winnings of ₹${winnings.toFixed(2)} distributed.` };
    });
});

// --- Withdrawal Functions ---
exports.requestWithdrawal = onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");
  const { amount, upiId } = data;
  const userId = context.auth.uid;

  if (typeof amount !== 'number' || amount <= 0) throw new functions.https.HttpsError("invalid-argument", "Invalid amount.");
  if (!upiId.match(/^[\\w.-]+@[\\w.-]+$/)) throw new functions.https.HttpsError("invalid-argument", "Invalid UPI ID.");

  return db.runTransaction(async (t) => {
    const walletRef = db.collection("wallets").doc(userId);
    const walletDoc = await t.get(walletRef);
    if (!walletDoc.exists || (walletDoc.data().winningBalance || 0) < amount) throw new functions.https.HttpsError("failed-precondition", "Insufficient winning balance.");
    
    t.update(walletRef, { winningBalance: admin.firestore.FieldValue.increment(-amount) });
    const requestRef = db.collection("withdrawalRequests").doc();
    t.set(requestRef, { userId, amount, upiId, status: 'pending', requestedAt: admin.firestore.FieldValue.serverTimestamp() });
    t.set(db.collection('transactions').doc(), { userId, type: 'debit', amount, reason: 'withdrawal_request', status: 'pending', withdrawalId: requestRef.id, timestamp: admin.firestore.FieldValue.serverTimestamp() });
    return { status: "success", message: "Withdrawal request submitted."};
  });
});

exports.processWithdrawal = onCall(async (data, context) => {
    await ensureIsAdmin(context);
    const { requestId, approve } = data;
    if (!requestId) throw new functions.https.HttpsError('invalid-argument', 'Request ID required.');

    const requestRef = db.collection('withdrawalRequests').doc(requestId);
    return db.runTransaction(async (t) => {
        const requestDoc = await t.get(requestRef);
        if (!requestDoc.exists) throw new functions.https.HttpsError('not-found', 'Request not found.');
        const requestData = requestDoc.data();
        if (requestData.status !== 'pending') throw new functions.https.HttpsError('failed-precondition', 'Request already processed.');

        const txQuery = await db.collection('transactions').where('withdrawalId', '==', requestId).limit(1).get();
        const txDoc = !txQuery.empty ? txQuery.docs[0] : null;

        if (approve) {
            t.update(requestRef, { status: 'approved', processedAt: admin.firestore.FieldValue.serverTimestamp() });
            if(txDoc) t.update(txDoc.ref, { status: 'completed' });
            return { status: 'success', message: `Request for ₹${requestData.amount} approved.` };
        } else {
            t.update(db.collection('wallets').doc(requestData.userId), { winningBalance: admin.firestore.FieldValue.increment(requestData.amount) });
            t.update(requestRef, { status: 'rejected', processedAt: admin.firestore.FieldValue.serverTimestamp() });
            if(txDoc) t.update(txDoc.ref, { status: 'rejected' });
            return { status: 'success', message: `Request for ₹${requestData.amount} rejected and refunded.` };
        }
    });
});




exports.grantAdminRole = require("./grantAdminRole").grantAdminRole;
