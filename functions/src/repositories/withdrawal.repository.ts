
import { firestore } from '../firebase';
import { FieldValue } from 'firebase-admin/firestore';

class WithdrawalRepository {
    private collection = firestore.collection('transactions_withdraw');

    /**
     * Retrieves a single withdrawal document within a transaction.
     *
     * @param {FirebaseFirestore.Transaction} transaction - The Firestore transaction object.
     * @param {string} withdrawalId - The ID of the withdrawal document.
     * @returns {Promise<FirebaseFirestore.DocumentSnapshot>} The document snapshot.
     */
    getWithdrawalInTransaction(transaction: FirebaseFirestore.Transaction, withdrawalId: string): Promise<FirebaseFirestore.DocumentSnapshot> {
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
    updateStatus(transaction: FirebaseFirestore.Transaction, withdrawalId: string, adminId: string, status: 'completed' | 'rejected'): void {
        const withdrawalRef = this.collection.doc(withdrawalId);
        transaction.update(withdrawalRef, {
            status: status,
            adminId: adminId,
            processedAt: FieldValue.serverTimestamp(),
        });
    }
}

export const withdrawalRepository = new WithdrawalRepository();
