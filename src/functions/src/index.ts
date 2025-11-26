

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
const getAppRules = async () => {
    const defaultRules = {
        adminCommissionRate: 0.10, 
        cancellationFee: 5, 
        minEntryFee: 50, 
        depositBonusRate: 0.05
    };
    try {
        const rulesDoc = await db.collection('settings').doc('rules').get();
        if (rulesDoc.exists) {
            return { ...defaultRules, ...rulesDoc.data() };
        }
    } catch (error) {
        console.error("Error fetching app rules, using defaults.", error);
    }
    return defaultRules;
};

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
        return {
            totalUsers,
            activeMatches,
            pendingDeposits,
            pendingWithdrawals,
            totalCommission: financeConfig.totalCommission,
            totalWinnings: financeConfig.totalWinnings,
        };
    } catch (error) {
        console.error("Error aggregating dashboard stats:", error);
        throw new functions.https.HttpsError("internal", "An error occurred while calculating statistics.", error);
    }
});

// --- NEW FUNCTION to fetch users ---
export const getUsers = regionalFunctions.https.onCall(async (_, context) => {
    await ensureIsAdmin(context);
    try {
        const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
        const adminSnapshot = await db.collection('roles_admin').get();
        const adminIds = new Set(adminSnapshot.docs.map(doc => doc.id));
        
        let activeUsers = 0;
        let blockedUsers = 0;
        let newToday = 0;
        const twentyFourHoursAgo = admin.firestore.Timestamp.now().toMillis() - (24 * 60 * 60 * 1000);

        const users = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            
            // Calculate stats
            if (data.status === 'active') activeUsers++;
            if (data.status === 'suspended') blockedUsers++;
            if (data.createdAt && data.createdAt.toMillis() > twentyFourHoursAgo) {
                newToday++;
            }

            return {
                id: doc.id,
                ...data,
                isAdmin: adminIds.has(doc.id)
            };
        });

        const stats = {
            totalUsers: users.length,
            activeUsers,
            blockedUsers,
            newToday,
            kycVerifiedUsers: 0, // Placeholder for future implementation
        };

        return { users, stats };
    } catch (error) {
        console.error("Error fetching users:", error);
        throw new functions.https.HttpsError("internal", "Could not fetch users.");
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
        if (!matchData) throw new functions.https.HttpsError("internal", "Match data is missing.");

        if (matchData.status === 'completed' || matchData.status === 'cancelled') {
            throw new functions.https.HttpsError("failed-precondition", "Match is already completed or cancelled.");
        }

        // Refund entry fee for all players
        const playerRefundPromises = (matchData.players || []).map(async (playerId: string) => {
            const playerWalletRef = db.collection('wallets').doc(playerId);
            const txQuery = db.collection('transactions').where('userId', '==', playerId).where('matchId', '==', matchId);
            
            const txSnapshot = await txQuery.get();
            const entryTx = txSnapshot.docs.find(doc => ['match_creation', 'match_join'].includes(doc.data().reason));

            if (entryTx) {
                const refundAmount = entryTx.data().amount;
                t.update(playerWalletRef, {
                    depositBalance: admin.firestore.FieldValue.increment(refundAmount)
                });
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
        
        t.update(matchRef, { 
            status: 'cancelled',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { status: 'success', message: `Match ${matchId} has been cancelled and all players refunded.` };
    });
});

// --- Match Functions ---
export const createMatch = regionalFunctions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");
    
    const { matchId, matchTitle, entryFee, maxPlayers, privacy, timeLimit } = data;
    const { uid } = context.auth;
    const rules = await getAppRules();

    if (typeof matchId !== 'string' || matchId.length < 4) throw new functions.https.HttpsError("invalid-argument", "Invalid Match ID.");
    if (typeof entryFee !== 'number' || entryFee < rules.minEntryFee) throw new functions.https.HttpsError("invalid-argument", `Entry fee must be at least ₹${rules.minEntryFee}.`);

    const matchRef = db.collection("matches").doc(matchId.toUpperCase());
    const walletRef = db.collection("wallets").doc(uid);
    const userRef = db.collection("users").doc(uid);

    return db.runTransaction(async (t) => {
        const [matchDoc, walletDoc, userDoc] = await Promise.all([t.get(matchRef), t.get(walletRef), t.get(userRef)]);

        if (matchDoc.exists) throw new functions.https.HttpsError("already-exists", "Room code already exists.");
        if (!walletDoc.exists) throw new functions.https.HttpsError("not-found", "Wallet not found.");
        if (!userDoc.exists) throw new functions.https.HttpsError("not-found", "User profile not found.");

        const walletData = walletDoc.data()!;
        const userData = userDoc.data()!;
        const totalBalance = (walletData.depositBalance || 0) + (walletData.winningBalance || 0) + (walletData.bonusBalance || 0);
        
        if (totalBalance < entryFee) throw new functions.https.HttpsError("failed-precondition", "Insufficient total balance.");

        let remainingFee = entryFee;
        let deductedFromBonus = Math.min(remainingFee, walletData.bonusBalance || 0);
        remainingFee -= deductedFromBonus;
        let deductedFromDeposit = Math.min(remainingFee, walletData.depositBalance || 0);
        remainingFee -= deductedFromDeposit;
        let deductedFromWinnings = remainingFee;
        
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
            matchTitle, entryFee, maxPlayers, privacy, timeLimit,
            status: "waiting",
            createdBy: uid,
            creatorName: creatorName,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            players: [uid],
            playerInfo: { [uid]: { name: creatorName, photoURL: creatorPhoto, isReady: false }},
        });
        
        const txDoc = db.collection("transactions").doc();
        t.set(txDoc, {
            userId: uid,
            type: "debit",
            amount: entryFee,
            reason: "match_creation",
            status: "completed",
            matchId: matchId.toUpperCase(),
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            breakdown: { fromDeposit: deductedFromDeposit, fromWinnings: deductedFromWinnings, fromBonus: deductedFromBonus }
        });
        
        return { result: { status: "success", message: "Match created!", matchId: matchId.toUpperCase() } };
    });
});

export const joinMatch = regionalFunctions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");

    const { matchId } = data;
    const { uid } = context.auth;

    if (typeof matchId !== 'string' || matchId.length === 0) throw new functions.https.HttpsError("invalid-argument", "Invalid Match ID provided.");

    const matchRef = db.collection("matches").doc(matchId);
    const walletRef = db.collection("wallets").doc(uid);
    const userRef = db.collection("users").doc(uid);

    return db.runTransaction(async (t) => {
        const [matchDoc, walletDoc, userDoc] = await Promise.all([t.get(matchRef), t.get(walletRef), t.get(userRef)]);

        if (!matchDoc.exists) throw new functions.https.HttpsError("not-found", "Match not found.");
        if (!walletDoc.exists) throw new functions.https.HttpsError("not-found", "Your wallet was not found.");
        if (!userDoc.exists) throw new functions.https.HttpsError("not-found", "Your user profile was not found.");

        const matchData = matchDoc.data()!;
        const walletData = walletDoc.data()!;
        const userData = userDoc.data()!;

        if (matchData.status !== "waiting") throw new functions.https.HttpsError("failed-precondition", `Match is not available for joining. Status: ${matchData.status}.`);
        if (matchData.players.includes(uid)) throw new functions.https.HttpsError("failed-precondition", "You have already joined this match.");
        if (matchData.players.length >= matchData.maxPlayers) throw new functions.https.HttpsError("failed-precondition", "This match is already full.");

        const entryFee = matchData.entry;
        const totalBalance = (walletData.depositBalance || 0) + (walletData.winningBalance || 0) + (walletData.bonusBalance || 0);
        if (totalBalance < entryFee) throw new functions.https.HttpsError("failed-precondition", "Insufficient balance to join this match.");

        // Fee deduction logic
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

        // Add player to match
        const playerName = userData.displayName || "Anonymous";
        const playerPhoto = userData.photoURL || null;
        t.update(matchRef, {
            players: admin.firestore.FieldValue.arrayUnion(uid),
            [`playerInfo.${uid}`]: { name: playerName, photoURL: playerPhoto, isReady: false },
        });

        // Create transaction record
        const txDoc = db.collection("transactions").doc();
        t.set(txDoc, {
            userId: uid,
            type: "debit",
            amount: entryFee,
            reason: "match_join",
            status: "completed",
            matchId: matchId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            breakdown: { fromDeposit: deductedFromDeposit, fromWinnings: deductedFromWinnings, fromBonus: deductedFromBonus }
        });

        return { status: "success", message: "Successfully joined the match!" };
    });
});

export const cancelMatch = regionalFunctions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required.");
    const { matchId } = data;
    const userId = context.auth.uid;
    if (typeof matchId !== 'string' || matchId.length === 0) throw new functions.https.HttpsError("invalid-argument", "Invalid Match ID.");
  
    const matchRef = db.collection("matches").doc(matchId);
    const rules = await getAppRules();
  
    return db.runTransaction(async (t) => {
        const matchDoc = await t.get(matchRef);
        if (!matchDoc.exists) throw new functions.https.HttpsError("not-found", "Match not found.");
        const matchData = matchDoc.data()!;
  
        if (matchData.createdBy !== userId) throw new functions.https.HttpsError("permission-denied", "Only the match creator can cancel.");
        if (matchData.status !== "waiting" || matchData.players.length > 1) throw new functions.https.HttpsError("failed-precondition", "Cannot cancel now, other players have joined.");
  
        const creationTxQuery = db.collection('transactions').where('userId', '==', userId).where('matchId', '==', matchId).where('reason', '==', 'match_creation');
        const txSnapshot = await t.get(creationTxQuery);
        
        if (txSnapshot.empty) throw new functions.https.HttpsError("internal", "Cannot find original transaction for refund.");
        
        const txData = txSnapshot.docs[0].data();
        const breakdown = txData.breakdown || { fromDeposit: txData.amount, fromWinnings: 0, fromBonus: 0 };
        
        const refundAmount = matchData.entry - rules.cancellationFee;

        t.update(db.collection('wallets').doc(userId), {
          depositBalance: admin.firestore.FieldValue.increment(breakdown.fromDeposit),
          winningBalance: admin.firestore.FieldValue.increment(breakdown.fromWinnings),
          bonusBalance: admin.firestore.FieldValue.increment(breakdown.fromBonus),
        });
        
        t.update(matchRef, { status: "cancelled", updatedAt: admin.firestore.FieldValue.serverTimestamp() });

        const refundTxRef = db.collection("transactions").doc();
        t.set(refundTxRef, {
            userId, 
            type: "credit", 
            amount: matchData.entry,
            reason: "match_cancellation_refund", 
            matchId, 
            status: 'completed',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return { status: "success", message: `Match cancelled. Your entry fee of ₹${matchData.entry} has been refunded.` };
    });
  });


    
