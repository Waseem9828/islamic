
import { HttpsError } from 'firebase-functions/v2/https';
import { firestore } from '../firebase';
import { adminRepository } from '../repositories/admin.repository';
import { withdrawalRepository } from '../repositories/withdrawal.repository';
import { activityRepository } from '../repositories/activity.repository';

class WithdrawalService {

    /**
     * Processes a withdrawal request with an ultra-fast, non-blocking, atomic transaction.
     * Follows the strict high-performance architecture requirements.
     *
     * @param {string} withdrawalId - The ID of the withdrawal to process.
     * @param {string} adminId - The ID of the admin processing the request.
     */
    async processWithdrawal(withdrawalId: string, adminId: string): Promise<{ status: string; message: string }> {
        try {
            await firestore.runTransaction(async (transaction) => {
                // 1. READ: Fetch withdrawal and admin documents concurrently.
                const [withdrawalDoc, adminDoc] = await Promise.all([
                    withdrawalRepository.getWithdrawalInTransaction(transaction, withdrawalId),
                    adminRepository.getAdminInTransaction(transaction, adminId)
                ]);

                // 2. VALIDATE: Perform critical checks.
                if (!withdrawalDoc.exists || withdrawalDoc.data()?.status !== 'pending') {
                    throw new HttpsError('not-found', 'Pending withdrawal request not found or already processed.');
                }
                if (!adminDoc.exists) {
                    throw new HttpsError('internal', 'Processing admin account does not exist.');
                }

                const withdrawalAmount = withdrawalDoc.data()?.amount;
                const adminWallet = adminDoc.data()?.wallet;

                // Server-side balance check as required.
                if (adminWallet.currentBalance < withdrawalAmount) {
                    throw new HttpsError('failed-precondition', 'Insufficient Admin Wallet Balance.');
                }

                // 3. WRITE: Perform all database writes concurrently within the transaction.
                // These are atomic, non-blocking operations.
                adminRepository.updateWalletBalance(transaction, adminId, withdrawalAmount);
                withdrawalRepository.updateStatus(transaction, withdrawalId, adminId, 'completed');
                activityRepository.createLog(transaction, {
                    adminId,
                    type: 'withdrawal_completed',
                    amount: withdrawalAmount,
                    userId: withdrawalDoc.data()?.userId,
                    withdrawalId,
                });
            });

            // 4. RETURN SUCCESS: Respond instantly after the transaction commits.
            return { status: 'success', message: 'Withdrawal completed successfully.' };

        } catch (error) {
            // The transaction automatically rolls back on error.
            // Re-throw custom HttpsError or a generic one for ultra-fast failure response.
            if (error instanceof HttpsError) {
                throw error;
            }
            // Log the detailed error for debugging without exposing it to the user.
            console.error('Error processing withdrawal:', error);
            throw new HttpsError('internal', 'An unexpected error occurred while processing the withdrawal.');
        }
    }
}

export const withdrawalService = new WithdrawalService();
