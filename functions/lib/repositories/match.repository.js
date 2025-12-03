"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchRepository = void 0;
const firebase_1 = require("../firebase");
const firestore_1 = require("firebase-admin/firestore");
class MatchRepository {
    constructor() {
        this.collection = firebase_1.firestore.collection('matches');
    }
    getMatch(matchId) {
        return this.collection.doc(matchId).get();
    }
    createMatch(transaction, matchData) {
        const docRef = this.collection.doc();
        transaction.create(docRef, matchData);
        return docRef.id;
    }
    joinMatch(transaction, matchId, userId, fee) {
        const docRef = this.collection.doc(matchId);
        transaction.update(docRef, {
            players: firestore_1.FieldValue.arrayUnion(userId),
            playerCount: firestore_1.FieldValue.increment(1),
        });
    }
    submitResult(transaction, matchId, resultData) {
        const docRef = this.collection.doc(matchId);
        transaction.update(docRef, resultData);
    }
    cancelMatch(transaction, matchId) {
        const docRef = this.collection.doc(matchId);
        transaction.update(docRef, {
            status: 'cancelled',
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
    }
}
exports.matchRepository = new MatchRepository();
//# sourceMappingURL=match.repository.js.map