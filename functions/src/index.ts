
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Helper to get app rules with fallbacks
const getAppRules = async () => {
  const defaultRules = {
    adminCommissionRate: 0.10,
    cancellationFee: 5,
    minEntryFee: 50,
    depositBonusRate: 0.05,
    minWithdrawalAmount: 300, 
  };
  const rulesDoc = await db.collection("settings").doc("rules").get();
  if (!rulesDoc.exists) {
    console.warn("App settings not found! Using default values.");
    return defaultRules;
  }
  return {...defaultRules, ...rulesDoc.data()};
};

// Admin check helper
const ensureIsAdmin = async (context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Admin-only function.");
  }
  const adminDoc = await db.collection("roles_admin").doc(context.auth.uid).get();
  if (!adminDoc.exists) {
    throw new functions.https.HttpsError("permission-denied", "Admin-only function.");
  }
};


// --- Admin & Roles Functions ---
export const manageAdminRole = functions.https.onCall(async (data, context) => {
    await ensureIsAdmin(context);
    const { uid, action } = data;
    if (!uid || !action) {
        throw new functions.https.HttpsError("invalid-argument", "UID and action are required.");
    }
    const userRef = db.collection("users").doc(uid);
    const adminRoleRef = db.collection("roles_admin").doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "The specified user does not exist.");
    }
    if (action === 'grant') {
        await adminRoleRef.set({ grantedAt: admin.firestore.FieldValue.serverTimestamp() });
        return { status: "success", message: `Admin role granted to ${userDoc.data()?.displayName || uid}.` };
    } else if (action === 'revoke') {
        await adminRoleRef.delete();
        return { status: "success", message: `Admin role revoked for ${userDoc.data()?.displayName || uid}.` };
    } else {
        throw new functions.https.HttpsError("invalid-argument", "Invalid action. Use 'grant' or 'revoke'.");
    }
});

export const getAdminDashboardStats = functions.https.onCall(async (_, context) => {
    await ensureIsAdmin(context);
    const matchesSnapshot = await db.collection("matches").get();
    const usersSnapshot = await db.collection("users").get();
    const depositRequestsSnapshot = await db.collection("depositRequests").where("status", "==", "pending").get();
    const withdrawalRequestsSnapshot = await db.collection("withdrawalRequests").where("status", "==", "pending").get();
    let totalCommission = 0;
    let totalWinnings = 0;
    let activeMatches = 0;
    matchesSnapshot.forEach(doc => {
        const match = doc.data();
        if (match.commission) totalCommission += match.commission;
        if (match.winnings) totalWinnings += match.winnings;
        if (match.status === 'waiting' || match.status === 'playing') activeMatches++;
    });
    return {
        totalCommission, totalWinnings, activeMatches,
        totalUsers: usersSnapshot.size,
        pendingDeposits: depositRequestsSnapshot.size,
        pendingWithdrawals: withdrawalRequestsSnapshot.size,
    };
});

export const updateUserStatus = functions.https.onCall(async (data, context) => {
    await ensureIsAdmin(context);
    const { uid, status } = data;
    if (!uid || !['active', 'suspended'].includes(status)) {
        throw new functions.https.HttpsError("invalid-argument", "User UID and a valid status ('active' or 'suspended') are required.");
    }
    await db.collection("users").doc(uid).update({ status });
    return { status: "success", message: `User has been ${status}.` };
});

export const adjustUserWallet = functions.https.onCall(async (data, context) => {
    await ensureIsAdmin(context);
    const { uid, adjustments, reason } = data;
    if (!uid || !adjustments || !reason) {
        throw new functions.https.HttpsError("invalid-argument", "UID, adjustments object, and reason are required.");
    }
    const walletRef = db.collection("wallets").doc(uid);
    const transactionRef = db.collection("transactions").doc();
    const updatePayload: {[key: string]: admin.firestore.FieldValue} = {};
    let totalAdjustment = 0;

    for (const [key, value] of Object.entries(adjustments)) {
        if (typeof value !== 'number' || value === 0) continue;
        if (!['depositBalance', 'winningBalance', 'bonusBalance'].includes(key)) continue;
        updatePayload[key] = admin.firestore.FieldValue.increment(value);
        totalAdjustment += value;
    }

    if (Object.keys(updatePayload).length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "No valid adjustments provided.");
    }

    await db.runTransaction(async (t) => {
        t.update(walletRef, updatePayload);
        t.set(transactionRef, {
            userId: uid,
            type: totalAdjustment > 0 ? 'credit' : 'debit',
            amount: Math.abs(totalAdjustment),
            status: 'approved',
            reason: 'admin_adjustment',
            details: reason,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });

    return { status: "success", message: "Wallet adjusted successfully." };
});

export const getMatches = functions.https.onCall(async (data, context) => {
    await ensureIsAdmin(context);
    const matchesSnapshot = await db.collection("matches").orderBy('createdAt', 'desc').get();
    const matches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { matches };
});


// --- Deposit Functions ---
export const requestDeposit = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");
    const {amount, transactionId, screenshotUrl} = data;
    if (!amount || typeof amount !== "number" || amount <= 0) throw new functions.https.HttpsError("invalid-argument", "Valid amount required.");
    if (!transactionId || typeof transactionId !== "string" || transactionId.trim().length < 12) throw new functions.https.HttpsError("invalid-argument", "Valid 12-digit Transaction ID required.");
    if (!screenshotUrl || typeof screenshotUrl !== "string" || !screenshotUrl.startsWith("https://")) throw new functions.https.HttpsError("invalid-argument", "A valid screenshot URL is required.");
    const depositRef = db.collection("depositRequests").doc();
    const transactionRef = db.collection("transactions").doc();
    await db.runTransaction(async (t) => {
        t.set(depositRef, {
            userId: context.auth?.uid, amount, transactionId: transactionId.trim(), screenshotUrl, status: "pending",
            requestedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        t.set(transactionRef, {
            userId: context.auth?.uid, type: "deposit", amount, status: "pending", referenceId: depositRef.id,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    return {status: "success", message: "Deposit request submitted."};
});

export const processDeposit = functions.https.onCall(async (data, context) => {
    await ensureIsAdmin(context);
    const {requestId, approve} = data;
    if (!requestId) throw new functions.https.HttpsError("invalid-argument", "Request ID required.");
    const requestRef = db.collection("depositRequests").doc(requestId);
    await db.runTransaction(async (t) => {
        const requestDoc = await t.get(requestRef);
        if (!requestDoc.exists) throw new functions.https.HttpsError("not-found", "Request not found.");
        if (requestDoc.data()?.status !== "pending") throw new functions.https.HttpsError("failed-precondition", "Request already processed.");
        const txQuery = await db.collection("transactions").where("referenceId", "==", requestId).limit(1).get();
        const txDoc = !txQuery.empty ? txQuery.docs[0] : null;
        if (approve) {
            const {userId, amount} = requestDoc.data() ?? {};
            const rules = await getAppRules();
            const bonusAmount = amount * rules.depositBonusRate;
            const walletRef = db.collection("wallets").doc(userId);
            t.update(walletRef, {
                depositBalance: admin.firestore.FieldValue.increment(amount),
                bonusBalance: admin.firestore.FieldValue.increment(bonusAmount),
                lifetimeBonus: admin.firestore.FieldValue.increment(bonusAmount),
            });
            t.update(requestRef, { status: "approved", processedAt: admin.firestore.FieldValue.serverTimestamp() });
            if (txDoc) t.update(txDoc.ref, { status: "approved", bonus: bonusAmount });
        } else {
            t.update(requestRef, { status: "rejected", processedAt: admin.firestore.FieldValue.serverTimestamp() });
            if (txDoc) t.update(txDoc.ref, {status: "rejected"});
        }
    });
    return {status: "success", message: approve ? "Deposit approved." : "Request rejected."};
});

// --- Match Functions ---
const ensureUserIsActive = async (uid: string) => {
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.status === 'suspended') {
        throw new functions.https.HttpsError("permission-denied", "Your account is suspended. Please contact support.");
    }
    return userDoc.data() ?? {};
}

export const createMatch = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");
  const {uid} = context.auth;
  const userData = await ensureUserIsActive(uid);

  const {matchId, entryFee} = data;
  const rules = await getAppRules();
  if (typeof matchId !== "string" || matchId.length < 4) throw new functions.https.HttpsError("invalid-argument", "Invalid Match ID.");
  if (typeof entryFee !== "number" || entryFee < rules.minEntryFee) throw new functions.https.HttpsError("invalid-argument", `Entry fee must be at least ₹${rules.minEntryFee}.`);
  
  const matchRef = db.collection("matches").doc(matchId.toUpperCase());
  const walletRef = db.collection("wallets").doc(uid);

  return db.runTransaction(async (t) => {
    const [matchDoc, walletDoc] = await Promise.all([t.get(matchRef), t.get(walletRef)]);
    if (matchDoc.exists) throw new functions.https.HttpsError("already-exists", "Room code already exists.");
    if (!walletDoc.exists) throw new functions.https.HttpsError("not-found", "Wallet not found.");

    const walletData = walletDoc.data() ?? {};
    const totalBalance = (walletData.depositBalance || 0) + (walletData.winningBalance || 0) + (walletData.bonusBalance || 0);
    if (totalBalance < entryFee) throw new functions.https.HttpsError("failed-precondition", "Insufficient balance.");

    let remainingFee = entryFee;
    const deductedFromBonus = Math.min(remainingFee, walletData.bonusBalance || 0);
    remainingFee -= deductedFromBonus;
    const deductedFromDeposit = Math.min(remainingFee, walletData.depositBalance || 0);
    remainingFee -= deductedFromDeposit;
    const deductedFromWinnings = remainingFee;

    t.update(walletRef, {
      bonusBalance: admin.firestore.FieldValue.increment(-deductedFromBonus),
      depositBalance: admin.firestore.FieldValue.increment(-deductedFromDeposit),
      winningBalance: admin.firestore.FieldValue.increment(-deductedFromWinnings),
    });
    t.set(matchRef, {
      ...data, id: matchId.toUpperCase(), status: "waiting", createdBy: uid,
      creatorName: userData.displayName || "Anonymous",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      players: [uid],
      playerInfo: {[uid]: {name: userData.displayName || "Anonymous", photoURL: userData.photoURL || null}},
    });
    t.set(db.collection("transactions").doc(), {
      userId: uid, type: "debit", amount: entryFee, reason: "match_fee", status: "approved",
      referenceId: matchId.toUpperCase(), createdAt: admin.firestore.FieldValue.serverTimestamp(),
      breakdown: {fromDeposit: deductedFromDeposit, fromWinnings: deductedFromWinnings, fromBonus: deductedFromBonus},
    });
    return {status: "success", message: "Match created!"};
  });
});

export const joinMatch = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    const { uid } = context.auth;
    const userData = await ensureUserIsActive(uid);

    const { matchId } = data;
    if (!matchId) throw new functions.https.HttpsError("invalid-argument", "Match ID is required.");

    const matchRef = db.collection("matches").doc(matchId);
    const walletRef = db.collection("wallets").doc(uid);

    return db.runTransaction(async (t) => {
        const [matchDoc, walletDoc] = await Promise.all([t.get(matchRef), t.get(walletRef)]);
        if (!matchDoc.exists) throw new functions.https.HttpsError("not-found", "Match not found.");
        if (!walletDoc.exists) throw new functions.https.HttpsError("not-found", "Your wallet was not found.");

        const matchData = matchDoc.data()!;
        const walletData = walletDoc.data()!;
        if (matchData.players.includes(uid)) throw new functions.https.HttpsError("already-exists", "You are already in this match.");
        if (matchData.status !== 'waiting') throw new functions.https.HttpsError("failed-precondition", "Match is not open for joining.");
        if (matchData.players.length >= matchData.maxPlayers) throw new functions.https.HttpsError("failed-precondition", "This match is full.");

        const entryFee = matchData.entry;
        const totalBalance = (walletData.depositBalance || 0) + (walletData.winningBalance || 0) + (walletData.bonusBalance || 0);
        if (totalBalance < entryFee) throw new functions.https.HttpsError("failed-precondition", "Insufficient balance.");

        let remainingFee = entryFee;
        const deductedFromBonus = Math.min(remainingFee, walletData.bonusBalance || 0);
        remainingFee -= deductedFromBonus;
        const deductedFromDeposit = Math.min(remainingFee, walletData.depositBalance || 0);
        remainingFee -= deductedFromDeposit;
        const deductedFromWinnings = remainingFee;

        t.update(walletRef, {
            bonusBalance: admin.firestore.FieldValue.increment(-deductedFromBonus),
            depositBalance: admin.firestore.FieldValue.increment(-deductedFromDeposit),
            winningBalance: admin.firestore.FieldValue.increment(-deductedFromWinnings),
        });
        t.update(matchRef, {
            players: admin.firestore.FieldValue.arrayUnion(uid),
            [`playerInfo.${uid}`]: { name: userData.displayName || "Anonymous", photoURL: userData.photoURL || null },
        });
        t.set(db.collection("transactions").doc(), {
            userId: uid, type: "debit", amount: entryFee, reason: "match_fee", status: "approved", referenceId: matchId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            breakdown: { fromDeposit: deductedFromDeposit, fromWinnings: deductedFromWinnings, fromBonus: deductedFromBonus },
        });
        return { status: "success", message: "Successfully joined the match!" };
    });
});

export const distributeWinnings = functions.https.onCall(async (data, context) => {
  await ensureIsAdmin(context);
  const {matchId, winnerId} = data;
  if (!matchId || !winnerId) throw new functions.https.HttpsError("invalid-argument", "matchId and winnerId required.");
  const matchRef = db.collection("matches").doc(matchId);
  const rules = await getAppRules();
  return db.runTransaction(async (t) => {
    const matchDoc = await t.get(matchRef);
    if (!matchDoc.exists) throw new functions.https.HttpsError("not-found", "Match not found.");
    const matchData = matchDoc.data() ?? {};
    if (matchData.status !== "completed") throw new functions.https.HttpsError("failed-precondition", `Match is not completed yet.`);
    if (matchData.winner) throw new functions.https.HttpsError("failed-precondition", `Winnings already distributed.`);
    if (!matchData.players.includes(winnerId)) throw new functions.https.HttpsError("failed-precondition", "Winner was not a player.");
    const totalPot = matchData.entry * matchData.players.length;
    const commission = totalPot * rules.adminCommissionRate;
    const winnings = totalPot - commission;
    t.update(db.collection("wallets").doc(winnerId), { winningBalance: admin.firestore.FieldValue.increment(winnings) });
    t.update(matchRef, {winner: winnerId, winnings, commission, status: "archived"});
    t.set(db.collection("transactions").doc(), {
      userId: winnerId, type: "credit", amount: winnings, reason: "match_win", referenceId: matchId,
      status: "approved", createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {status: "success", message: `Winnings of ₹${winnings.toFixed(2)} distributed.`};
  });
});

export const cancelMatch = functions.https.onCall(async (data, context) => {
    await ensureIsAdmin(context);
    const { matchId } = data;
    if (!matchId) {
        throw new functions.https.HttpsError("invalid-argument", "Match ID is required.");
    }

    const matchRef = db.collection("matches").doc(matchId);
    const rules = await getAppRules();

    return db.runTransaction(async (t) => {
        const matchDoc = await t.get(matchRef);
        if (!matchDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Match not found.");
        }

        const matchData = matchDoc.data()!;

        if (matchData.status === 'cancelled' || matchData.status === 'archived') {
            throw new functions.https.HttpsError("failed-precondition", `Match is already ${matchData.status}.`);
        }

        // Refund players
        for (const playerId of matchData.players) {
            // Logic to fetch original deductions from transactions
            const txQuery = await db.collection("transactions")
                .where("userId", "==", playerId)
                .where("referenceId", "==", matchId)
                .where("reason", "==", "match_fee")
                .limit(1)
                .get();

            if (txQuery.empty) continue;
            const tx = txQuery.docs[0].data();

            const walletRef = db.collection("wallets").doc(playerId);
            t.update(walletRef, {
                depositBalance: admin.firestore.FieldValue.increment(tx.breakdown.fromDeposit || 0),
                winningBalance: admin.firestore.FieldValue.increment(tx.breakdown.fromWinnings || 0),
                bonusBalance: admin.firestore.FieldValue.increment(tx.breakdown.fromBonus || 0),
            });
        }

        t.update(matchRef, { 
            status: 'cancelled',
            cancellationReason: 'admin_action',
        });

        return { status: "success", message: "Match cancelled and players refunded." };
    });
});


// --- Withdrawal Functions ---
export const requestWithdrawal = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");
  const {uid} = context.auth;
  await ensureUserIsActive(uid);
  const {amount, upiId} = data;
  const rules = await getAppRules();
  if (typeof amount !== "number" || amount < rules.minWithdrawalAmount) throw new functions.https.HttpsError("invalid-argument", `Minimum withdrawal is ₹${rules.minWithdrawalAmount}.`);
  if (!upiId.match(/^[\w.-]+@[\w.-]+$/)) throw new functions.https.HttpsError("invalid-argument", "Invalid UPI ID format.");

  return db.runTransaction(async (t) => {
    const walletRef = db.collection("wallets").doc(uid);
    const walletDoc = await t.get(walletRef);
    if (!walletDoc.exists || (walletDoc.data()?.winningBalance || 0) < amount) throw new functions.https.HttpsError("failed-precondition", "Insufficient winning balance.");
    t.update(walletRef, { winningBalance: admin.firestore.FieldValue.increment(-amount) });
    const requestRef = db.collection("withdrawalRequests").doc();
    t.set(requestRef, {
      userId: uid, amount, upiId, status: "pending",
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    t.set(db.collection("transactions").doc(), {
      userId: uid, type: "withdrawal", amount, status: "pending", referenceId: requestRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {status: "success", message: "Withdrawal request submitted."};
  });
});

export const processWithdrawal = functions.https.onCall(async (data, context) => {
  await ensureIsAdmin(context);
  const {requestId, approve} = data;
  if (!requestId) throw new functions.https.HttpsError("invalid-argument", "Request ID required.");
  const requestRef = db.collection("withdrawalRequests").doc(requestId);
  return db.runTransaction(async (t) => {
    const requestDoc = await t.get(requestRef);
    if (!requestDoc.exists) throw new functions.https.HttpsError("not-found", "Request not found.");
    const requestData = requestDoc.data() ?? {};
    if (requestData.status !== "pending") throw new functions.https.HttpsError("failed-precondition", "Request already processed.");
    const txQuery = await db.collection("transactions").where("referenceId", "==", requestId).limit(1).get();
    const txDoc = !txQuery.empty ? txQuery.docs[0] : null;
    if (approve) {
      t.update(requestRef, {status: "approved", processedAt: admin.firestore.FieldValue.serverTimestamp()});
      if (txDoc) t.update(txDoc.ref, {status: "approved"});
      return {status: "success", message: `Request for ₹${requestData.amount} approved.`};
    } else {
      t.update(db.collection("wallets").doc(requestData.userId), { winningBalance: admin.firestore.FieldValue.increment(requestData.amount) });
      t.update(requestRef, {status: "rejected", processedAt: admin.firestore.FieldValue.serverTimestamp()});
      if (txDoc) t.update(txDoc.ref, {status: "rejected"});
      return {status: "success", message: `Request for ₹${requestData.amount} rejected and refunded.`};
    }
  });
});
