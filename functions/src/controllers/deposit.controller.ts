
import { onCall } from 'firebase-functions/v2/https';
import { depositService } from '../services/deposit.service';
import { ensureWorkerAdmin } from '../services/auth.service';
import { HttpsError } from 'firebase-functions/v2/https';

const region = 'asia-south1';

export const getPendingTransactions = onCall({ region, cors: true }, async (request) => {
    await ensureWorkerAdmin(request);
    return await depositService.getPendingTransactions();
});

export const handleDepositByAdmin = onCall({ region, cors: true }, async (request) => {
    const adminId = await ensureWorkerAdmin(request);
    const { depositId, action } = request.data;

    if (!depositId || !action || !['approved', 'rejected'].includes(action)) {
        throw new HttpsError('invalid-argument', 'Invalid request');
    }

    return await depositService.handleDeposit(depositId, action, adminId);
});
