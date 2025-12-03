
import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================

const getAdminData = async (uid: string): Promise<any> => {
  if (!uid) return null;
  try {
    const adminDoc = await db.collection("admins").doc(uid).get();
    return adminDoc.exists ? adminDoc.data() : null;
  } catch (error) {
    logger.error(`Error checking admin status for UID: ${uid}`, error);
    return null;
  }
};

const ensureAuthenticated = (context: { auth?: { uid: string } }) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
};

const ensureSuperAdmin = async (context: { auth?: { uid: string } }) => {
  ensureAuthenticated(context);
  const adminData = await getAdminData(context.auth!.uid);
  if (!adminData || adminData.role !== 'super') {
    throw new HttpsError("permission-denied", "This function must be called by a super admin.");
  }
};

const ensureWorkerAdmin = async (context: { auth?: { uid: string } }) => {
    ensureAuthenticated(context);
    const adminData = await getAdminData(context.auth!.uid);
    if (!adminData || !['worker', 'super'].includes(adminData.role)) {
        throw new HttpsError("permission-denied", "This function must be called by an admin.");
    }
    return adminData;
};

const region = "asia-south1";

// =====================================================================
// SUPER ADMIN CALLABLE FUNCTIONS
// =====================================================================

export const createWorkerAdmin = onCall({ region, cors: true }, async (request) => {
    await ensureSuperAdmin(request);
    const { email, name, password } = request.data;
    if (!email || !name || !password) {
        throw new HttpsError("invalid-argument", "Valid email, name, and password are required.");
    }
    try {
        const userRecord = await admin.auth().createUser({ email, password, displayName: name });
        await db.collection("admins").doc(userRecord.uid).set({
            name: name, role: "worker",
            wallet: { totalAdded: 0, totalUsed: 0, currentBalance: 0 },
            createdAt: admin.firestore.FieldValue.serverTimestamp(), status: "active",
        });
        return { status: "success", message: `Worker admin ${name} created successfully.`, uid: userRecord.uid };
    } catch (error: any) {
        logger.error("Error creating worker admin:", error);
        if (error.code === 'auth/email-already-exists') throw new HttpsError("already-exists", "The email address is already in use.");
        throw new HttpsError("internal", "An unexpected error occurred.");
    }
});

export const addBalanceToAdminWallet = onCall({ region, cors: true }, async (request) => {
    await ensureSuperAdmin(request);
    const { adminId, amount } = request.data;
    if (!adminId || typeof amount !== 'number' || amount <= 0) {
        throw new HttpsError("invalid-argument", "A valid admin ID and a positive amount are required.");
    }
    const adminRef = db.collection("admins").doc(adminId);
    const historyRef = db.collection("adminWalletHistory").doc();
    try {
        await db.runTransaction(async (transaction) => {
            const adminDoc = await transaction.get(adminRef);
            if (!adminDoc.exists || adminDoc.data()?.role !== 'worker') {
                throw new HttpsError("not-found", "The specified worker admin account does not exist.");
            }
            transaction.update(adminRef, {
                'wallet.totalAdded': admin.firestore.FieldValue.increment(amount),
                'wallet.currentBalance': admin.firestore.FieldValue.increment(amount)
            });
            transaction.set(historyRef, { adminId, amountAdded: amount, date: admin.firestore.FieldValue.serverTimestamp(), addedBy: request.auth!.uid });
        });
        return { status: "success", message: `₹${amount} added to admin's wallet.` };
    } catch(error) {
        logger.error(`Error adding balance to admin ${adminId}:`, error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "Failed to update admin wallet.");
    }
});

export const getAllAdmins = onCall({ region, cors: true }, async (request) => {
    await ensureSuperAdmin(request);
    try {
        const adminsSnapshot = await db.collection('admins').orderBy('createdAt', 'desc').get();
        return adminsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        logger.error("Error fetching all admins:", error);
        throw new HttpsError('internal', 'Could not fetch admin list.');
    }
});

// =====================================================================
// WORKER & SUPER ADMIN CALLABLE FUNCTIONS
// =====================================================================

export const getPendingTransactions = onCall({ region, cors: true }, async (request) => {
    await ensureWorkerAdmin(request);
    try {
        const depositsSnap = await db.collection('transactions_deposit').where('status', '==', 'pending').orderBy('timestamp', 'asc').get();
        const withdrawalsSnap = await db.collection('transactions_withdraw').where('status', '==', 'pending').orderBy('timestamp', 'asc').get();
        
        const deposits = depositsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const withdrawals = withdrawalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return { deposits, withdrawals };
    } catch (error) {
        logger.error("Error fetching pending transactions:", error);
        throw new HttpsError('internal', 'Failed to fetch pending transactions.');
    }
});

export const handleDepositByAdmin = onCall({ region, cors: true }, async (request) => {
    await ensureWorkerAdmin(request);
    const adminId = request.auth!.uid;
    const { depositId, action } = request.data;

    if (!depositId || !['approved', 'rejected'].includes(action)) {
        throw new HttpsError('invalid-argument', "A valid deposit ID and action ('approved' or 'rejected') are required.");
    }

    const depositRef = db.collection('transactions_deposit').doc(depositId);

    try {
        await db.runTransaction(async (transaction) => {
            const depositDoc = await transaction.get(depositRef);
            if (!depositDoc.exists || depositDoc.data()?.status !== 'pending') {
                throw new HttpsError("not-found", "Pending deposit request not found or has already been processed.");
            }

            const depositData = depositDoc.data()!;
            const updateData = { status: action, adminId, processedAt: admin.firestore.FieldValue.serverTimestamp() };

            if (action === 'approved') {
                const userWalletRef = db.collection("wallets").doc(depositData.userId);
                transaction.update(userWalletRef, { depositBalance: admin.firestore.FieldValue.increment(depositData.amount) });
            }
            
            transaction.update(depositRef, updateData);

            const logRef = db.collection('adminActivity').doc();
            transaction.set(logRef, {
                adminId, type: `deposit_${action}`,
                amount: depositData.amount, userId: depositData.userId,
                depositId: depositId, timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        return { status: "success", message: `Deposit has been ${action}.` };
    } catch (error) {
        logger.error(`Error processing deposit ${depositId} by admin ${adminId}:`, error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "An unexpected error occurred while processing the deposit.");
    }
});

export const handleWithdrawalByAdmin = onCall({ region, cors: true }, async (request) => {
    await ensureWorkerAdmin(request);
    const adminId = request.auth!.uid;
    const { withdrawalId, action } = request.data;
    
    if(!withdrawalId || !['completed', 'rejected'].includes(action)) {
        throw new HttpsError('invalid-argument', "A valid withdrawal ID and action ('completed' or 'rejected') are required.");
    }
    
    const withdrawalRef = db.collection("transactions_withdraw").doc(withdrawalId);
    const adminRef = db.collection("admins").doc(adminId);

    try {
        await db.runTransaction(async (transaction) => {
            const adminDoc = await transaction.get(adminRef);
            const withdrawalDoc = await transaction.get(withdrawalRef);

            if (!adminDoc.exists) throw new HttpsError("internal", "Admin performing the action not found.");
            if (!withdrawalDoc.exists || !['pending', 'approved'].includes(withdrawalDoc.data()?.status)) {
                throw new HttpsError("not-found", "Request not found or has already been processed.");
            }
            
            const withdrawalData = withdrawalDoc.data()!;
            
            if (action === 'rejected') {
                // Refund user's balance which was pre-deducted on request
                const userWalletRef = db.collection("wallets").doc(withdrawalData.userId);
                transaction.update(userWalletRef, { winningBalance: admin.firestore.FieldValue.increment(withdrawalData.amount) });
                transaction.update(withdrawalRef, { status: 'rejected', adminId: adminId, completedAt: admin.firestore.FieldValue.serverTimestamp() });
                return;
            }

            // Action is 'completed'
            const adminWallet = adminDoc.data()!.wallet;
            const withdrawalAmount = withdrawalData.amount;

            if (adminWallet.currentBalance < withdrawalAmount) {
                throw new HttpsError("failed-precondition", "Insufficient Admin Wallet Balance to complete this withdrawal.");
            }
            
            transaction.update(adminRef, {
                'wallet.currentBalance': admin.firestore.FieldValue.increment(-withdrawalAmount),
                'wallet.totalUsed': admin.firestore.FieldValue.increment(withdrawalAmount)
            });

            transaction.update(withdrawalRef, { status: "completed", adminId: adminId, completedAt: admin.firestore.FieldValue.serverTimestamp() });
            
            const logRef = db.collection('adminActivity').doc();
            transaction.set(logRef, {
                adminId, type: "withdrawal_completed", amount: withdrawalAmount,
                userId: withdrawalData.userId, withdrawalId, timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        
        return { status: "success", message: `Withdrawal has been successfully ${action}.` };

    } catch (error) {
        logger.error(`Error processing withdrawal ${withdrawalId} by admin ${adminId}:`, error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError("internal", "An unexpected error occurred.");
    }
});

// =====================================================================
// USER-FACING CALLABLE FUNCTIONS
// =====================================================================

export const requestDeposit = onCall({ region, cors: true }, async (request) => {
  ensureAuthenticated(request);
  const { amount, transactionId, screenshotUrl } = request.data;
  const uid = request.auth!.uid;
  if (!amount || typeof amount !== 'number' || amount <= 0 || !transactionId || !screenshotUrl) {
    throw new HttpsError("invalid-argument", "Valid amount, transaction ID, and screenshot URL are required.");
  }
  const depositRequest = { userId: uid, amount, transactionId, screenshotUrl, status: "pending", timestamp: admin.firestore.FieldValue.serverTimestamp() };
  await db.collection("transactions_deposit").add(depositRequest);
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
        if (!walletDoc.exists) throw new HttpsError("not-found", "User wallet not found.");
        const walletData = walletDoc.data()!;
        if (walletData.winningBalance < amount) {
            throw new HttpsError("failed-precondition", "Insufficient winning balance.");
        }
        transaction.update(walletRef, { winningBalance: admin.firestore.FieldValue.increment(-amount) });
        transaction.update(userRef, { upiId: upiId });
        const withdrawalRequestRef = db.collection("transactions_withdraw").doc();
        transaction.set(withdrawalRequestRef, { userId: uid, amount, upiId, status: "pending", timestamp: admin.firestore.FieldValue.serverTimestamp() });
        return { status: "success", message: "Withdrawal request submitted." };
    });
});
