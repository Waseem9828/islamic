
import { firestore } from '../firebase';
import { FieldValue } from 'firebase-admin/firestore';

class UserRepository {
    private collection = firestore.collection('users');

    updateWalletBalance(transaction: FirebaseFirestore.Transaction, userId: string, amount: number, balanceType: 'deposit' | 'winnings') {
        const docRef = this.collection.doc(userId);
        const fieldToUpdate = balanceType === 'deposit' ? 'depositBalance' : 'winningBalance';
        transaction.update(docRef, {
            [fieldToUpdate]: FieldValue.increment(amount),
        });
    }
}

export const userRepository = new UserRepository();
