
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";

const corsHandler = cors({ origin: true });


// Safely initialize the Firebase Admin SDK, preventing re-initialization.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = admin.storage();
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


// --- Deposit Functions ---
export const requestDeposit = regionalFunctions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to make a deposit request.");
    }

    const { amount, transactionId, screenshotUrl } = data;
    const uid = context.auth.uid;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new functions.https.HttpsError("invalid-argument", "A valid amount is required.");
    }
    if (!transactionId || typeof transactionId !== 'string' || transactionId.trim().length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "A transaction ID is required.");
    }
    if (!screenshotUrl || typeof screenshotUrl !== 'string') {
        throw new functions.https.HttpsError("invalid-argument", "A screenshot URL is required.");
    }

    try {
        await db.collection("depositRequests").add({
            userId: uid,
            amount: amount,
            transactionId: transactionId,
            screenshotUrl: screenshotUrl,
            status: 'pending',
            requestedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { status: "success", message: "Deposit request submitted successfully." };
    } catch (error) {
        console.error("Error creating deposit request:", error);
        throw new functions.https.HttpsError("internal", "Could not submit your deposit request at this time.");
    }
});

export const processDeposit = regionalFunctions.https.onCall(async (data, context) => {
    await ensureIsAdmin(context);
    const { requestId, approve } = data;
    if (!requestId) throw new functions.https.HttpsError('invalid-argument', 'Request ID is required.');

    const requestRef = db.collection('depositRequests').doc(requestId);
    
    return db.runTransaction(async (t) => {
        const requestDoc = await t.get(requestRef);
        if (!requestDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Deposit request not found.');
        }
        if (requestDoc.data()!.status !== 'pending') {
            throw new functions.https.HttpsError('failed-precondition', 'Request has already been processed.');
        }

        const { userId, amount } = requestDoc.data()!;

        if (approve) {
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

            // Update request status
            t.update(requestRef, {
                status: 'approved',
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                processedBy: context.auth!.uid
            });
            
            // Create transaction record
            const txRef = db.collection('transactions').doc();
            t.set(txRef, {
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
            t.update(requestRef, {
                status: 'rejected',
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                processedBy: context.auth!.uid
            });
            return { status: 'success', message: "Request rejected." };
        }
    });
});


// --- Admin & Roles Functions ---
export const getAdminDashboardStats = regionalFunctions.https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
        if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
            res.status(403).send({ error: 'Unauthorized: No token provided.' });
            return;
        }
        try {
            const idToken = req.headers.authorization.split('Bearer ')[1];
            const decodedIdToken = await admin.auth().verifyIdToken(idToken);
            
            const adminDoc = await db.collection("roles_admin").doc(decodedIdToken.uid).get();
            if (!adminDoc.exists) {
                res.status(403).send({ error: 'Permission Denied: User is not an admin.' });
                return;
            }

            // Fetch Stats
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
            const financeConfig = appConfigSnapshot.data() || { totalCommission: 0, totalWinnings: 0 };
            
            const stats = {
                totalUsers: usersSnapshot.size,
                activeMatches: matchesSnapshot.size,
                pendingDeposits: depositsSnapshot.size,
                pendingWithdrawals: withdrawalsSnapshot.size,
                totalCommission: financeConfig.totalCommission,
                totalWinnings: financeConfig.totalWinnings,
            };

            // Fetch Chart Data
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const sevenDaysAgoTimestamp = admin.firestore.Timestamp.fromDate(sevenDaysAgo);
            
            const [signupsSnapshot, revenueSnapshot] = await Promise.all([
                db.collection('users').where('createdAt', '>=', sevenDaysAgoTimestamp).get(),
                db.collection('transactions').where('reason', '==', 'match_win_commission').where('timestamp', '>=', sevenDaysAgoTimestamp).get()
            ]);

            const processSnaps = (snapshot: admin.firestore.QuerySnapshot, valueField?: string) => {
                const dataByDate: { [key: string]: number } = {};
                snapshot.docs.forEach(doc => {
                    const docData = doc.data();
                    const date = (docData.createdAt || docData.timestamp).toDate();
                    const dateKey = date.toISOString().split('T')[0];
                    dataByDate[dateKey] = (dataByDate[dateKey] || 0) + (valueField ? docData[valueField] : 1);
                });
                return dataByDate;
            };

            const signupsByDate = processSnaps(signupsSnapshot);
            const revenueByDate = processSnaps(revenueSnapshot, 'amount');

            const chartData = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateKey = d.toISOString().split('T')[0];
                chartData.push({
                    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    "New Users": signupsByDate[dateKey] || 0,
                    "Revenue": revenueByDate[dateKey] || 0,
                });
            }
            
            res.status(200).send({ stats, chartData });

        } catch (error: any) {
            console.error("Error in getAdminDashboardStats:", error);
            if (error.code === 'auth/id-token-expired') {
                 res.status(401).send({ error: 'Unauthorized: Token expired.' });
            } else {
                 res.status(500).send({ error: "An internal error occurred while calculating statistics." });
            }
        }
    });
});

export const updateUserStatus = regionalFunctions.https.onCall(async (data, context) => {
    await ensureIsAdmin(context);
    const { uid, status } = data;
    if (!uid || !['active', 'suspended'].includes(status)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid UID or status provided.');
    }
    await db.collection('users').doc(uid).update({ status });
    return { success: true };
});

export const getWalletInfo = regionalFunctions.https.onCall(async (data, context) => {
    await ensureIsAdmin(context);
    const { uid } = data;
    if (!uid) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid UID provided.');
    }
    const walletDoc = await db.collection('wallets').doc(uid).get();
    if (!walletDoc.exists) {
        return { depositBalance: 0, winningBalance: 0, bonusBalance: 0, };
    }
    const walletData = walletDoc.data()!;
    return {
        depositBalance: walletData.depositBalance || 0,
        winningBalance: walletData.winningBalance || 0,
        bonusBalance: walletData.bonusBalance || 0,
    };
});

export const analyzeStorage = regionalFunctions.https.onCall(async (_, context) => {
    await ensureIsAdmin(context);
    try {
        const bucket = storage.bucket(); 
        const [files] = await bucket.getFiles();
        
        let totalSize = 0;
        files.forEach(file => {
            totalSize += parseInt(file.metadata.size as string, 10);
        });

        const formatBytes = (bytes: number, decimals = 2) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }

        return {
            fileCount: files.length,
            totalSize: formatBytes(totalSize),
            files: files.map(f => ({ name: f.name, size: formatBytes(parseInt(f.metadata.size as string, 10))})),
        };
    } catch (error) {
        console.error("Error analyzing storage bucket:", error);
        throw new functions.https.HttpsError("internal", "Failed to analyze storage.", error);
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

        const entryFee = matchData.entryFee;
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
        
        const refundAmount = matchData.entryFee; // No cancellation fee if creator cancels alone

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
            amount: refundAmount,
            reason: "match_cancellation_refund", 
            matchId, 
            status: 'completed',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return { status: "success", message: `Match cancelled. Your entry fee of ₹${refundAmount} has been refunded.` };
    });
  });

    

    

    