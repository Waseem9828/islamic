"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDepositByAdmin = exports.getPendingTransactions = void 0;
const https_1 = require("firebase-functions/v2/https");
const deposit_service_1 = require("../services/deposit.service");
const auth_service_1 = require("../services/auth.service");
const https_2 = require("firebase-functions/v2/https");
const region = 'asia-south1';
exports.getPendingTransactions = (0, https_1.onCall)({ region, cors: true }, async (request) => {
    await (0, auth_service_1.ensureWorkerAdmin)(request);
    return await deposit_service_1.depositService.getPendingTransactions();
});
exports.handleDepositByAdmin = (0, https_1.onCall)({ region, cors: true }, async (request) => {
    const adminId = await (0, auth_service_1.ensureWorkerAdmin)(request);
    const { depositId, action } = request.data;
    if (!depositId || !action || !['approved', 'rejected'].includes(action)) {
        throw new https_2.HttpsError('invalid-argument', 'Invalid request');
    }
    return await deposit_service_1.depositService.handleDeposit(depositId, action, adminId);
});
//# sourceMappingURL=deposit.controller.js.map