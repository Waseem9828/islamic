"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.depositService = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_1 = require("../firebase");
const deposit_repository_1 = require("../repositories/deposit.repository");
const user_repository_1 = require("../repositories/user.repository");
const activity_repository_1 = require("../repositories/activity.repository");
class DepositService {
    async getPendingTransactions() {
        // For now, we only have deposit requests that can be pending
        const deposits = await deposit_repository_1.depositRepository.getPendingDeposits();
        return { deposits, withdrawals: [] }; // Withdrawals are handled differently
    }
    async handleDeposit(depositId, action, adminId) {
        return firebase_1.firestore.runTransaction(async (transaction) => {
            var _a, _b, _c;
            const depositDoc = await deposit_repository_1.depositRepository.getDepositInTransaction(transaction, depositId);
            if (!depositDoc.exists || ((_a = depositDoc.data()) === null || _a === void 0 ? void 0 : _a.status) !== 'pending') {
                throw new https_1.HttpsError('not-found', 'Pending deposit not found or already processed.');
            }
            if (action === 'approved') {
                const depositData = depositDoc.data();
                // Update user wallet
                user_repository_1.userRepository.updateWalletBalance(transaction, depositData.userId, depositData.amount, 'deposit');
                // Update deposit status
                deposit_repository_1.depositRepository.updateDepositStatus(transaction, depositId, 'approved', adminId);
                // Log admin activity
                activity_repository_1.activityRepository.createLog(transaction, {
                    adminId,
                    type: 'deposit_approved',
                    amount: depositData.amount,
                    userId: depositData.userId,
                    depositId,
                });
            }
            else { // rejected
                deposit_repository_1.depositRepository.updateDepositStatus(transaction, depositId, 'rejected', adminId);
                activity_repository_1.activityRepository.createLog(transaction, {
                    adminId,
                    type: 'deposit_rejected',
                    amount: (_b = depositDoc.data()) === null || _b === void 0 ? void 0 : _b.amount,
                    userId: (_c = depositDoc.data()) === null || _c === void 0 ? void 0 : _c.userId,
                    depositId,
                });
            }
            return { status: 'success', message: `Deposit ${action}.` };
        });
    }
}
exports.depositService = new DepositService();
//# sourceMappingURL=deposit.service.js.map