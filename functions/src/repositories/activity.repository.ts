
import { firestore } from '../firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { AdminActivity } from '../types/activity.types';

class ActivityRepository {
    private collection = firestore.collection('adminActivity');

    /**
     * Creates a new activity log entry within a transaction.
     * This is a fire-and-forget, non-blocking write operation.
     *
     * @param {FirebaseFirestore.Transaction} transaction - The Firestore transaction object.
     * @param {AdminActivity} activityData - The activity data to log.
     */
    createLog(transaction: FirebaseFirestore.Transaction, activityData: Omit<AdminActivity, 'timestamp'>): void {
        const logRef = this.collection.doc(); // Auto-generate ID
        transaction.set(logRef, {
            ...activityData,
            timestamp: FieldValue.serverTimestamp(),
        });
    }
}

export const activityRepository = new ActivityRepository();
