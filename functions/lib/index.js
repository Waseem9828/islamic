"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWalletInfo = exports.updateUserStatus = exports.getAdminDashboardStats = exports.checkAdminStatus = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
// Internal helper function to check for admin privileges
const _isAdmin = async (uid) => {
    if (uid === 'Mh28D81npYYDfC3z8mslVIPFu5H3') {
        return true;
    }
    const adminDoc = await db.collection("roles_admin").doc(uid).get();
    return adminDoc.exists;
};
// Callable function to check if a user is an admin
exports.checkAdminStatus = functions
    .region("us-east1")
    .https.onCall(async (_, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const isAdmin = await _isAdmin(context.auth.uid);
    return { isAdmin };
});
// Callable function to get admin dashboard stats
exports.getAdminDashboardStats = functions
    .region("us-east1")
    .https.onCall(async (_, context) => {
    if (!context.auth || !(await _isAdmin(context.auth.uid))) {
        throw new functions.https.HttpsError("permission-denied", "User is not an admin.");
    }
    // Fetch stats
    const usersSnapshot = await db.collection("users").get();
    const matchesSnapshot = await db.collection("matches").get();
    const depositsSnapshot = await db.collection("deposits").get();
    const withdrawalsSnapshot = await db.collection("withdrawals").get();
    const totalUsers = usersSnapshot.size;
    const activeMatches = matchesSnapshot.docs.filter(doc => doc.data().status === 'active').length;
    const pendingDeposits = depositsSnapshot.docs.filter(doc => doc.data().status === 'pending').length;
    const pendingWithdrawals = withdrawalsSnapshot.docs.filter(doc => doc.data().status === 'pending').length;
    const totalCommission = matchesSnapshot.docs.reduce((sum, doc) => sum + (doc.data().commission || 0), 0);
    const totalWinnings = withdrawalsSnapshot.docs.reduce((sum, doc) => {
        if (doc.data().status === 'completed') {
            return sum + doc.data().amount;
        }
        return sum;
    }, 0);
    return {
        totalUsers,
        activeMatches,
        pendingDeposits,
        pendingWithdrawals,
        totalCommission,
        totalWinnings,
    };
});
// Callable function to update a user's status
exports.updateUserStatus = functions
    .region("us-east1")
    .https.onCall(async (data, context) => {
    if (!context.auth || !(await _isAdmin(context.auth.uid))) {
        throw new functions.https.HttpsError("permission-denied", "User is not an admin.");
    }
    const { uid, status } = data;
    if (!uid || !['active', 'suspended'].includes(status)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid UID or status provided.');
    }
    await admin.firestore().collection('users').doc(uid).update({ status });
    return { success: true };
});
// New callable function to get wallet info for a specific user
exports.getWalletInfo = functions
    .region("us-east1")
    .https.onCall(async (data, context) => {
    if (!context.auth || !(await _isAdmin(context.auth.uid))) {
        throw new functions.https.HttpsError("permission-denied", "User is not an admin.");
    }
    const { uid } = data;
    if (!uid) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid UID provided.');
    }
    const walletDoc = await admin.firestore().collection('wallets').doc(uid).get();
    if (!walletDoc.exists) {
        return {
            depositBalance: 0,
            winningBalance: 0,
            bonusBalance: 0,
        };
    }
    const walletData = walletDoc.data();
    return {
        depositBalance: (walletData === null || walletData === void 0 ? void 0 : walletData.depositBalance) || 0,
        winningBalance: (walletData === null || walletData === void 0 ? void 0 : walletData.winningBalance) || 0,
        bonusBalance: (walletData === null || walletData === void 0 ? void 0 : walletData.bonusBalance) || 0,
    };
});
//# sourceMappingURL=index.js.map