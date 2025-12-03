
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { withdrawalService } from '../services/withdrawal.service';
import { ensureWorkerAdmin } from '../services/auth.service'; // We will create this service next

// Define region for optimal performance
const region = 'asia-south1';

/**
 * A highly optimized, non-blocking cloud function for handling withdrawals.
 * This is the entry point, part of the Controller layer.
 */
export const handleWithdrawal = onCall({ region, cors: true }, async (request) => {
    // 1. Authenticate and authorize the admin (ultra-fast check)
    const adminId = await ensureWorkerAdmin(request);

    // 2. Validate the request payload (minimal validation)
    const { withdrawalId } = request.data;
    if (!withdrawalId || typeof withdrawalId !== 'string') {
        throw new HttpsError('invalid-argument', 'A valid withdrawal ID is required.');
    }

    // 3. Delegate to the service layer for processing
    // The controller does not know or care about the business logic.
    try {
        const result = await withdrawalService.processWithdrawal(withdrawalId, adminId);
        return result; // Instantly return success from the service
    } catch (error) {
        // Catch errors bubbled up from the service/repository layers
        if (error instanceof HttpsError) {
            throw error;
        }
        // Generic error for unexpected issues
        throw new HttpsError('internal', 'Failed to process withdrawal.');
    }
});
