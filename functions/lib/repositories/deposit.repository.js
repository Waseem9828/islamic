"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.depositRepository = void 0;
const firebase_1 = require("../firebase");
const firestore_1 = require("firebase-admin/firestore");
class DepositRepository {
    constructor() {
        this.collection = firebase_1.firestore.collection('transactions_deposit');
    }
    async getPendingDeposits() {
        const snapshot = await this.collection
            .where('status', '==', 'pending')
            .orderBy('timestamp', 'asc')
            .get();
        return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    }
    updateDepositStatus(transaction, depositId, status, adminId) {
        const docRef = this.collection.doc(depositId);
        transaction.update(docRef, {
            status,
            adminId,
            processedAt: firestore_1.FieldValue.serverTimestamp(),
        });
    }
    getDepositInTransaction(transaction, depositId) {
        const docRef = this.collection.doc(depositId);
        return transaction.get(docRef);
    }
}
exports.depositRepository = new DepositRepository();
//# sourceMappingURL=deposit.repository.js.map