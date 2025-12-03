
import { firestore } from '../firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { Admin } from '../types/admin.types';

class AdminRepository {
    private collection = firestore.collection('admins');

    /**
     * Atomically updates a worker admin's wallet balance after a withdrawal.
     * This is a highly optimized, non-blocking atomic operation.
     *
     * @param {FirebaseFirestore.Transaction} transaction - The Firestore transaction object.
     * @param {string} adminId - The UID of the admin whose wallet is being updated.
     * @param {number} amount - The amount to deduct (as a negative number).
     */
    updateWalletBalance(transaction: FirebaseFirestore.Transaction, adminId: string, amount: number): void {
        const adminRef = this.collection.doc(adminId);
        transaction.update(adminRef, {
            'wallet.currentBalance': FieldValue.increment(-amount),
            'wallet.totalUsed': FieldValue.increment(amount),
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
    getAdminInTransaction(transaction: FirebaseFirestore.Transaction, adminId: string): Promise<FirebaseFirestore.DocumentSnapshot> {
        const adminRef = this.collection.doc(adminId);
        return transaction.get(adminRef);
    }
}

export const adminRepository = new AdminRepository();
