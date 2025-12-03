"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityRepository = void 0;
const firebase_1 = require("../firebase");
const firestore_1 = require("firebase-admin/firestore");
class ActivityRepository {
    constructor() {
        this.collection = firebase_1.firestore.collection('adminActivity');
    }
    /**
     * Creates a new activity log entry within a transaction.
     * This is a fire-and-forget, non-blocking write operation.
     *
     * @param {FirebaseFirestore.Transaction} transaction - The Firestore transaction object.
     * @param {AdminActivity} activityData - The activity data to log.
     */
    createLog(transaction, activityData) {
        const logRef = this.collection.doc(); // Auto-generate ID
        transaction.set(logRef, Object.assign(Object.assign({}, activityData), { timestamp: firestore_1.FieldValue.serverTimestamp() }));
    }
}
exports.activityRepository = new ActivityRepository();
//# sourceMappingURL=activity.repository.js.map