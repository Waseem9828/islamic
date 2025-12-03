"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRepository = void 0;
const firebase_1 = require("../firebase");
const firestore_1 = require("firebase-admin/firestore");
class AdminRepository {
    constructor() {
        this.collection = firebase_1.firestore.collection('admins');
    }
    /**
     * Atomically updates a worker admin's wallet balance after a withdrawal.
     * This is a highly optimized, non-blocking atomic operation.
     *
     * @param {FirebaseFirestore.Transaction} transaction - The Firestore transaction object.
     * @param {string} adminId - The UID of the admin whose wallet is being updated.
     * @param {number} amount - The amount to deduct (as a negative number).
     */
    updateWalletBalance(transaction, adminId, amount) {
        const adminRef = this.collection.doc(adminId);
        transaction.update(adminRef, {
            'wallet.currentBalance': firestore_1.FieldValue.increment(-amount),
            'wallet.totalUsed': firestore_1.FieldValue.increment(amount),
        });
    }
    /**
     * Retrieves a single admin document within a transaction for validation.
     * Optimized to only fetch necessary data during a transaction.
     *
     * @param {FirebaseFirestore.Transaction} transaction - The Firestore transaction object.
     * @param {string} adminId - The admin's UID.
     * @returns {Promise<FirebaseFirestore.DocumentSnapshot>} The document snapshot.
     */
    getAdminInTransaction(transaction, adminId) {
        const adminRef = this.collection.doc(adminId);
        return transaction.get(adminRef);
    }
}
exports.adminRepository = new AdminRepository();
//# sourceMappingURL=admin.repository.js.map