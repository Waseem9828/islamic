"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const firebase_1 = require("../firebase");
const firestore_1 = require("firebase-admin/firestore");
class UserRepository {
    constructor() {
        this.collection = firebase_1.firestore.collection('users');
    }
    updateWalletBalance(transaction, userId, amount, balanceType) {
        const docRef = this.collection.doc(userId);
        const fieldToUpdate = balanceType === 'deposit' ? 'depositBalance' : 'winningBalance';
        transaction.update(docRef, {
            [fieldToUpdate]: firestore_1.FieldValue.increment(amount),
        });
    }
}
exports.userRepository = new UserRepository();
//# sourceMappingURL=user.repository.js.map