
import { firestore } from '../firebase';
import { FieldValue } from 'firebase-admin/firestore';

class DepositRepository {
    private collection = firestore.collection('transactions_deposit');

    async getPendingDeposits() {
        const snapshot = await this.collection
            .where('status', '==', 'pending')
            .orderBy('timestamp', 'asc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    updateDepositStatus(transaction: FirebaseFirestore.Transaction, depositId: string, status: 'approved' | 'rejected', adminId: string) {
        const docRef = this.collection.doc(depositId);
        transaction.update(docRef, {
            status,
            adminId,
            processedAt: FieldValue.serverTimestamp(),
        });
    }

    getDepositInTransaction(transaction: FirebaseFirestore.Transaction, depositId: string) {
        const docRef = this.collection.doc(depositId);
        return transaction.get(docRef);
    }
}

export const depositRepository = new DepositRepository();
