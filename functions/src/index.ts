
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

// Helper to get the latest app rules from Firestore with safety fallbacks
const getAppRules = async () => {
    const defaultRules = {
        adminCommissionRate: 0.10, // 10%
        cancellationFee: 5,      // ₹5
        minEntryFee: 50,         // ₹50
        depositBonusRate: 0.05   // 5%
    };

    const rulesDoc = await db.collection('settings').doc('rules').get();
    
    if (!rulesDoc.exists) {
        console.warn("App settings document not found! Using default values.");
        return defaultRules;
    }
    
    // Merge fetched data with defaults to ensure all keys exist and prevent errors
    const fetchedRules = rulesDoc.data();
    return { ...defaultRules, ...fetchedRules };
};

// Helper to check for Admin privileges
const ensureIsAdmin = (context) => {
    if (!context.auth || !context.auth.token.isAdmin) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'This function can only be called by an admin.'
        );
    }
};

exports.requestDeposit = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    }
    const { amount, transactionId } = data;
    const userId = context.auth.uid;

    if (typeof amount !== 'number' || amount <= 0) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid amount.");
    }
    if (typeof transactionId !== 'string' || transactionId.length < 12) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid Transaction ID.");
    }

    await db.collection("depositRequests").add({
        userId,
        amount,
        transactionId,
        status: 'pending',
        requestedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { status: "success" };
});

exports.processDeposit = functions.https.onCall(async (data, context) => {
    ensureIsAdmin(context);
    const { requestId, approve } = data;

    if (!requestId) {
        throw new functions.https.HttpsError('invalid-argument', 'Request ID is required.');
    }

    const requestRef = db.collection('depositRequests').doc(requestId);
    
    try {
        const requestDoc = await requestRef.get();

        if (!requestDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Deposit request not found.');
        }
        if (requestDoc.data().status !== 'pending') {
            throw new functions.https.HttpsError('failed-precondition', 'Request has already been processed.');
        }

        if (approve) {
            const { userId, amount } = requestDoc.data();
            const rules = await getAppRules();
            const bonusAmount = amount * rules.depositBonusRate;

            const walletRef = db.collection('wallets').doc(userId);

            await db.runTransaction(async (transaction) => {
                const walletDoc = await transaction.get(walletRef);
                if (!walletDoc.exists) {
                    transaction.set(walletRef, {
                        depositBalance: amount,
                        bonusBalance: bonusAmount,
                        winningBalance: 0,
                    });
                } else {
                    transaction.update(walletRef, {
                        depositBalance: admin.firestore.FieldValue.increment(amount),
                        bonusBalance: admin.firestore.FieldValue.increment(bonusAmount),
                    });
                }
                
                transaction.update(requestRef, { status: 'approved', processedAt: admin.firestore.FieldValue.serverTimestamp() });

                const txRef = db.collection('transactions').doc();
                transaction.set(txRef, {
                    userId, type: 'credit', amount, reason: 'deposit', depositId: requestId, 
                    bonus: bonusAmount, timestamp: admin.firestore.FieldValue.serverTimestamp(),
                });
            });
            return { status: 'success', message: `₹${amount} ( + ₹${bonusAmount} bonus) added to user ${userId}.` };
        } else {
            await requestRef.update({ status: 'rejected', processedAt: admin.firestore.FieldValue.serverTimestamp() });
            return { status: 'success', message: "Deposit request rejected." };
        }
    } catch (error) {
        console.error("Error processing deposit:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError("internal", "An unexpected error occurred.");
    }
});

exports.createMatch = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in to create a match.");
  }

  const { matchId, matchTitle, entryFee, maxPlayers, privacy, timeLimit } = data;
  const userId = context.auth.uid;
  const userDisplayName = context.auth.token.name || "Anonymous";
  const userPhotoURL = context.auth.token.picture || null;
  
  const rules = await getAppRules();

  if (typeof matchId !== 'string' || matchId.length < 4) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid Match ID.");
  }
  if (typeof entryFee !== 'number' || entryFee < rules.minEntryFee) {
    throw new functions.https.HttpsError("invalid-argument", `Entry fee must be at least ₹${rules.minEntryFee}.`);
  }

  const matchRef = db.collection("matches").doc(matchId.toUpperCase());
  const walletRef = db.collection("wallets").doc(userId);

  return db.runTransaction(async (transaction) => {
    const matchDoc = await transaction.get(matchRef);
    if (matchDoc.exists) {
      throw new functions.https.HttpsError("already-exists", "This room code already exists.");
    }
    const walletDoc = await transaction.get(walletRef);
    if (!walletDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Wallet not found.");
    }
    const walletData = walletDoc.data();
    const totalBalance = (walletData.depositBalance || 0) + (walletData.winningBalance || 0) + (walletData.bonusBalance || 0);
    if (totalBalance < entryFee) {
      throw new functions.https.HttpsError("failed-precondition", "Insufficient balance.");
    }

    let remainingFee = entryFee;
    let deductedFromBonus = Math.min(remainingFee, walletData.bonusBalance || 0);
    remainingFee -= deductedFromBonus;
    let deductedFromDeposit = Math.min(remainingFee, walletData.depositBalance || 0);
    remainingFee -= deductedFromDeposit;
    let deductedFromWinnings = Math.min(remainingFee, walletData.winningBalance || 0);
    remainingFee -= deductedFromWinnings;

    if (remainingFee > 0.01) { // Use a small tolerance for floating point issues
        throw new functions.https.HttpsError("failed-precondition", "Insufficient balance after detailed check.");
    }

    transaction.update(walletRef, { 
        bonusBalance: admin.firestore.FieldValue.increment(-deductedFromBonus),
        depositBalance: admin.firestore.FieldValue.increment(-deductedFromDeposit),
        winningBalance: admin.firestore.FieldValue.increment(-deductedFromWinnings),
    });
    
    const newMatch = {
        id: matchId.toUpperCase(), room: matchId.toUpperCase(), matchTitle, entry: entryFee, maxPlayers, privacy, timeLimit, status: "waiting", createdBy: userId, creatorName: userDisplayName, createdAt: admin.firestore.FieldValue.serverTimestamp(), players: [userId], playerInfo: { [userId]: { name: userDisplayName, photoURL: userPhotoURL, isReady: false }, },
    };
    transaction.set(matchRef, newMatch);
    
    const txRef = db.collection("transactions").doc();
    transaction.set(txRef, {
        userId, type: "debit", amount: entryFee, reason: "match_creation", matchId: matchId.toUpperCase(), timestamp: admin.firestore.FieldValue.serverTimestamp(), 
        breakdown: { fromDeposit: deductedFromDeposit, fromWinnings: deductedFromWinnings, fromBonus: deductedFromBonus }
    });
    
    return { status: "success", message: "Match created successfully!" };
  });
});

exports.cancelMatch = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }
  const { matchId } = data;
  const userId = context.auth.uid;
  if (typeof matchId !== 'string' || matchId.length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid Match ID.");
  }

  const matchRef = db.collection("matches").doc(matchId);
  const rules = await getAppRules();

  return db.runTransaction(async (transaction) => {
      const matchDoc = await transaction.get(matchRef);
      if (!matchDoc.exists) { throw new functions.https.HttpsError("not-found", "Match not found."); }
      const matchData = matchDoc.data();

      if (matchData.createdBy !== userId) { throw new functions.https.HttpsError("permission-denied", "Only the creator can cancel."); }
      if (matchData.status !== "waiting" || matchData.players.length > 1) { throw new functions.https.HttpsError("failed-precondition", "Match cannot be cancelled now."); }

      const entryFee = matchData.entry;
      if (entryFee < rules.cancellationFee) {
          throw new functions.https.HttpsError("failed-precondition", `Entry fee is less than cancellation charge of ₹${rules.cancellationFee}.`);
      }
      
      const creationTxQuery = await db.collection('transactions').where('userId', '==', userId).where('matchId', '==', matchId).where('reason', '==', 'match_creation').limit(1).get();
      if (creationTxQuery.empty) {
          throw new functions.https.HttpsError("internal", "Could not find original creation transaction. Cannot process refund.");
      }
      const txData = creationTxQuery.docs[0].data();
      const { fromDeposit = 0, fromWinnings = 0, fromBonus = 0 } = txData.breakdown;

      const refundAmount = entryFee - rules.cancellationFee;

      const refundToDeposit = fromDeposit > 0 ? (entryFee - rules.cancellationFee) * (fromDeposit / entryFee) : 0;
      const refundToWinnings = fromWinnings > 0 ? (entryFee - rules.cancellationFee) * (fromWinnings / entryFee) : 0;
      const refundToBonus = fromBonus > 0 ? (entryFee - rules.cancellationFee) * (fromBonus / entryFee) : 0;

      transaction.update(db.collection('wallets').doc(userId), {
        depositBalance: admin.firestore.FieldValue.increment(refundToDeposit),
        winningBalance: admin.firestore.FieldValue.increment(refundToWinnings),
        bonusBalance: admin.firestore.FieldValue.increment(refundToBonus),
      });
      
      transaction.update(matchRef, { status: "cancelled" });

      const refundTxRef = db.collection("transactions").doc();
      transaction.set(refundTxRef, {
        userId, type: "credit", amount: refundAmount, reason: "match_cancellation_refund", matchId: matchId, timestamp: admin.firestore.FieldValue.serverTimestamp(),
        breakdown: { toDeposit: refundToDeposit, toWinnings: refundToWinnings, toBonus: refundToBonus, fee: rules.cancellationFee }
      });
      
      return { status: "success", message: `Match cancelled with a fee of ₹${rules.cancellationFee}.` };
  });
});

exports.distributeWinnings = functions.https.onCall(async (data, context) => {
    ensureIsAdmin(context);

    const { matchId, winnerId } = data;
    if (!matchId || !winnerId) {
        throw new functions.https.HttpsError('invalid-argument', 'matchId and winnerId are required.');
    }

    const matchRef = db.collection('matches').doc(matchId);
    const rules = await getAppRules();

    return db.runTransaction(async (transaction) => {
        const matchDoc = await transaction.get(matchRef);
        if (!matchDoc.exists) { throw new functions.https.HttpsError('not-found', 'Match not found.'); }
        const matchData = matchDoc.data();

        if (matchData.status !== 'inprogress' && matchData.status !== 'waiting') { 
            throw new functions.https.HttpsError('failed-precondition', `Match is already ${matchData.status}.`);
        }
        if (!matchData.players.includes(winnerId)){
            throw new functions.https.HttpsError('failed-precondition', 'Winner was not a player in this match.');
        }

        const totalPot = matchData.entry * matchData.players.length;
        const commission = totalPot * rules.adminCommissionRate;
        const winnings = totalPot - commission;

        transaction.update(db.collection('wallets').doc(winnerId), { 
            winningBalance: admin.firestore.FieldValue.increment(winnings) 
        });

        transaction.update(matchRef, { status: 'completed', winner: winnerId, winnings, commission });

        const txRef = db.collection('transactions').doc();
        transaction.set(txRef, {
            userId: winnerId, type: 'credit', amount: winnings, reason: 'match_win', matchId: matchId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { status: 'success', message: `Winnings of ₹${winnings.toFixed(2)} distributed.` };
    });
});

exports.requestWithdrawal = functions.https.onCall(async (data, context) => {
  if (!context.auth) { throw new functions.https.HttpsError("unauthenticated", "You must be logged in."); }
  const { amount, upiId } = data;
  const userId = context.auth.uid;

  if (typeof amount !== 'number' || amount <= 0) { throw new functions.https.HttpsError("invalid-argument", "Invalid amount."); }
  if (!upiId.match(/^[\w.-]+@[\w.-]+$/)) { throw new functions.https.HttpsError("invalid-argument", "Invalid UPI ID format."); }

  const walletRef = db.collection("wallets").doc(userId);

  return db.runTransaction(async (transaction) => {
    const walletDoc = await transaction.get(walletRef);
    if (!walletDoc.exists) { throw new functions.https.HttpsError("not-found", "Wallet not found."); }
    
    if ((walletDoc.data().winningBalance || 0) < amount) {
      throw new functions.https.HttpsError("failed-precondition", "Insufficient winning balance.");
    }
    
    transaction.update(walletRef, { winningBalance: admin.firestore.FieldValue.increment(-amount) });
    const requestRef = db.collection("withdrawalRequests").doc();
    transaction.set(requestRef, { userId, amount, upiId, status: 'pending', requestedAt: admin.firestore.FieldValue.serverTimestamp(), });
    transaction.set(db.collection('transactions').doc(), { userId, type: 'debit', amount, reason: 'withdrawal_request', status: 'pending', withdrawalId: requestRef.id, timestamp: admin.firestore.FieldValue.serverTimestamp(), });

    return { status: "success", message: "Withdrawal request submitted."};
  });
});

exports.processWithdrawal = functions.https.onCall(async (data, context) => {
    ensureIsAdmin(context);
    const { requestId, approve } = data;
    if (!requestId) { throw new functions.https.HttpsError('invalid-argument', 'Request ID is required.'); }

    const requestRef = db.collection('withdrawalRequests').doc(requestId);

    return db.runTransaction(async (transaction) => {
        const requestDoc = await transaction.get(requestRef);
        if (!requestDoc.exists) { throw new functions.https.HttpsError('not-found', 'Request not found.'); }
        const requestData = requestDoc.data();
        if (requestData.status !== 'pending') { throw new functions.https.HttpsError('failed-precondition', 'Request already processed.'); }

        const txQuery = await db.collection('transactions').where('withdrawalId', '==', requestId).limit(1).get();
        const txDoc = txQuery.docs[0];

        if (approve) {
            transaction.update(requestRef, { status: 'approved', processedAt: admin.firestore.FieldValue.serverTimestamp() });
            if(txDoc) transaction.update(txDoc.ref, { status: 'completed' });
            return { message: `Request for ₹${requestData.amount} approved.` };
        } else {
            // Refund the money if rejected
            transaction.update(db.collection('wallets').doc(requestData.userId), { winningBalance: admin.firestore.FieldValue.increment(requestData.amount) });
            transaction.update(requestRef, { status: 'rejected', processedAt: admin.firestore.FieldValue.serverTimestamp() });
            if(txDoc) transaction.update(txDoc.ref, { status: 'rejected' });
            return { message: `Request for ₹${requestData.amount} rejected and refunded.` };
        }
    });
});
