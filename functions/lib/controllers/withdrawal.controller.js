"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWithdrawal = void 0;
const https_1 = require("firebase-functions/v2/https");
const withdrawal_service_1 = require("../services/withdrawal.service");
const auth_service_1 = require("../services/auth.service"); // We will create this service next
// Define region for optimal performance
const region = 'asia-south1';
/**
 * A highly optimized, non-blocking cloud function for handling withdrawals.
 * This is the entry point, part of the Controller layer.
 */
exports.handleWithdrawal = (0, https_1.onCall)({ region, cors: true }, async (request) => {
    // 1. Authenticate and authorize the admin (ultra-fast check)
    const adminId = await (0, auth_service_1.ensureWorkerAdmin)(request);
    // 2. Validate the request payload (minimal validation)
    const { withdrawalId } = request.data;
    if (!withdrawalId || typeof withdrawalId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'A valid withdrawal ID is required.');
    }
    // 3. Delegate to the service layer for processing
    // The controller does not know or care about the business logic.
    try {
        const result = await withdrawal_service_1.withdrawalService.processWithdrawal(withdrawalId, adminId);
        return result; // Instantly return success from the service
    }
    catch (error) {
        // Catch errors bubbled up from the service/repository layers
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        // Generic error for unexpected issues
        throw new https_1.HttpsError('internal', 'Failed to process withdrawal.');
    }
});
//# sourceMappingURL=withdrawal.controller.js.map