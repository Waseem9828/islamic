
import { HttpsError } from 'firebase-functions/v2/https';
import { firestore } from '../firebase';
import { depositRepository } from '../repositories/deposit.repository';
import { userRepository } from '../repositories/user.repository';
import { activityRepository } from '../repositories/activity.repository';

class DepositService {
    async getPendingTransactions() {
        // For now, we only have deposit requests that can be pending
        const deposits = await depositRepository.getPendingDeposits();
        return { deposits, withdrawals: [] }; // Withdrawals are handled differently
    }

    async handleDeposit(depositId: string, action: 'approved' | 'rejected', adminId: string) {
        return firestore.runTransaction(async (transaction) => {
            const depositDoc = await depositRepository.getDepositInTransaction(transaction, depositId);

            if (!depositDoc.exists || depositDoc.data()?.status !== 'pending') {
                throw new HttpsError('not-found', 'Pending deposit not found or already processed.');
            }

            if (action === 'approved') {
                const depositData = depositDoc.data()!;
                // Update user wallet
                userRepository.updateWalletBalance(transaction, depositData.userId, depositData.amount, 'deposit');
                // Update deposit status
                depositRepository.updateDepositStatus(transaction, depositId, 'approved', adminId);
                 // Log admin activity
                 activityRepository.createLog(transaction, {
                    adminId,
                    type: 'deposit_approved',
                    amount: depositData.amount,
                    userId: depositData.userId,
                    depositId,
                });
            } else { // rejected
                depositRepository.updateDepositStatus(transaction, depositId, 'rejected', adminId);
                 activityRepository.createLog(transaction, {
                    adminId,
                    type: 'deposit_rejected',
                    amount: depositDoc.data()?.amount,
                    userId: depositDoc.data()?.userId,
                    depositId,
                });
            }
            return { status: 'success', message: `Deposit ${action}.` };
        });
    }
}

export const depositService = new DepositService();
