"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawalService = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_1 = require("../firebase");
const admin_repository_1 = require("../repositories/admin.repository");
const withdrawal_repository_1 = require("../repositories/withdrawal.repository");
const activity_repository_1 = require("../repositories/activity.repository");
class WithdrawalService {
    /**
     * Processes a withdrawal request with an ultra-fast, non-blocking, atomic transaction.
     * Follows the strict high-performance architecture requirements.
     *
     * @param {string} withdrawalId - The ID of the withdrawal to process.
     * @param {string} adminId - The ID of the admin processing the request.
     */
    async processWithdrawal(withdrawalId, adminId) {
        try {
            await firebase_1.firestore.runTransaction(async (transaction) => {
                var _a, _b, _c, _d;
                // 1. READ: Fetch withdrawal and admin documents concurrently.
                const [withdrawalDoc, adminDoc] = await Promise.all([
                    withdrawal_repository_1.withdrawalRepository.getWithdrawalInTransaction(transaction, withdrawalId),
                    admin_repository_1.adminRepository.getAdminInTransaction(transaction, adminId)
                ]);
                // 2. VALIDATE: Perform critical checks.
                if (!withdrawalDoc.exists || ((_a = withdrawalDoc.data()) === null || _a === void 0 ? void 0 : _a.status) !== 'pending') {
                    throw new https_1.HttpsError('not-found', 'Pending withdrawal request not found or already processed.');
                }
                if (!adminDoc.exists) {
                    throw new https_1.HttpsError('internal', 'Processing admin account does not exist.');
                }
                const withdrawalAmount = (_b = withdrawalDoc.data()) === null || _b === void 0 ? void 0 : _b.amount;
                const adminWallet = (_c = adminDoc.data()) === null || _c === void 0 ? void 0 : _c.wallet;
                // Server-side balance check as required.
                if (adminWallet.currentBalance < withdrawalAmount) {
                    throw new https_1.HttpsError('failed-precondition', 'Insufficient Admin Wallet Balance.');
                }
                // 3. WRITE: Perform all database writes concurrently within the transaction.
                // These are atomic, non-blocking operations.
                admin_repository_1.adminRepository.updateWalletBalance(transaction, adminId, withdrawalAmount);
                withdrawal_repository_1.withdrawalRepository.updateStatus(transaction, withdrawalId, adminId, 'completed');
                activity_repository_1.activityRepository.createLog(transaction, {
                    adminId,
                    type: 'withdrawal_completed',
                    amount: withdrawalAmount,
                    userId: (_d = withdrawalDoc.data()) === null || _d === void 0 ? void 0 : _d.userId,
                    withdrawalId,
                });
            });
            // 4. RETURN SUCCESS: Respond instantly after the transaction commits.
            return { status: 'success', message: 'Withdrawal completed successfully.' };
        }
        catch (error) {
            // The transaction automatically rolls back on error.
            // Re-throw custom HttpsError or a generic one for ultra-fast failure response.
            if (error instanceof https_1.HttpsError) {
                throw error;
            }
            // Log the detailed error for debugging without exposing it to the user.
            console.error('Error processing withdrawal:', error);
            throw new https_1.HttpsError('internal', 'An unexpected error occurred while processing the withdrawal.');
        }
    }
}
exports.withdrawalService = new WithdrawalService();
//# sourceMappingURL=withdrawal.service.js.map