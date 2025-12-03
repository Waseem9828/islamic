"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawalRepository = void 0;
const firebase_1 = require("../firebase");
const firestore_1 = require("firebase-admin/firestore");
class WithdrawalRepository {
    constructor() {
        this.collection = firebase_1.firestore.collection('transactions_withdraw');
    }
    /**
     * Retrieves a single withdrawal document within a transaction.
     *
     * @param {FirebaseFirestore.Transaction} transaction - The Firestore transaction object.
     * @param {string} withdrawalId - The ID of the withdrawal document.
     * @returns {Promise<FirebaseFirestore.DocumentSnapshot>} The document snapshot.
     */
    getWithdrawalInTransaction(transaction, withdrawalId) {
        const withdrawalRef = this.collection.doc(withdrawalId);
        return transaction.get(withdrawalRef);
    }
    /**
     * Atomically updates the status and details of a withdrawal document.
     * This is a non-blocking, indexed update operation.
     *
     * @param {FirebaseFirestore.Transaction} transaction - The Firestore transaction object.
     * @param {string} withdrawalId - The ID of the withdrawal to update.
     * @param {string} adminId - The ID of the admin processing the request.
     * @param {'completed' | 'rejected'} status - The new status.
     */
    updateStatus(transaction, withdrawalId, adminId, status) {
        const withdrawalRef = this.collection.doc(withdrawalId);
        transaction.update(withdrawalRef, {
            status: status,
            adminId: adminId,
            processedAt: firestore_1.FieldValue.serverTimestamp(),
        });
    }
}
exports.withdrawalRepository = new WithdrawalRepository();
//# sourceMappingURL=withdrawal.repository.js.map