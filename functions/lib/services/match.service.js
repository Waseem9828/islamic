"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchService = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_1 = require("../firebase");
const match_repository_1 = require("../repositories/match.repository");
const user_repository_1 = require("../repositories/user.repository");
const firestore_1 = require("firebase-admin/firestore");
class MatchService {
    async createMatch(userId, fee) {
        return firebase_1.firestore.runTransaction(async (transaction) => {
            if (fee <= 0) {
                throw new https_1.HttpsError('invalid-argument', 'Match fee must be positive.');
            }
            const matchData = {
                fee,
                hostId: userId,
                players: [userId],
                playerCount: 1,
                status: 'pending',
                createdAt: firestore_1.FieldValue.serverTimestamp(),
            };
            const matchId = match_repository_1.matchRepository.createMatch(transaction, matchData);
            user_repository_1.userRepository.updateWalletBalance(transaction, userId, -fee, 'deposit');
            return { matchId };
        });
    }
    async joinMatch(userId, matchId) {
        return firebase_1.firestore.runTransaction(async (transaction) => {
            const matchDoc = await match_repository_1.matchRepository.getMatch(matchId);
            if (!matchDoc.exists) {
                throw new https_1.HttpsError('not-found', 'Match not found.');
            }
            const matchData = matchDoc.data();
            if (matchData.players.includes(userId)) {
                throw new https_1.HttpsError('already-exists', 'You have already joined this match.');
            }
            if (matchData.status !== 'pending') {
                throw new https_1.HttpsError('failed-precondition', 'Match is not open for joining.');
            }
            match_repository_1.matchRepository.joinMatch(transaction, matchId, userId, matchData.fee);
            user_repository_1.userRepository.updateWalletBalance(transaction, userId, -matchData.fee, 'deposit');
            return { matchId };
        });
    }
    async submitResult(userId, matchId, result) {
        return firebase_1.firestore.runTransaction(async (transaction) => {
            const matchDoc = await match_repository_1.matchRepository.getMatch(matchId);
            if (!matchDoc.exists) {
                throw new https_1.HttpsError('not-found', 'Match not found.');
            }
            const matchData = matchDoc.data();
            if (matchData.status !== 'pending') {
                throw new https_1.HttpsError('failed-precondition', 'Match has already concluded.');
            }
            if (!matchData.players.includes(userId)) {
                throw new https_1.HttpsError('permission-denied', 'Only players can submit results.');
            }
            if (!matchData.players.includes(result.winnerId)) {
                throw new https_1.HttpsError('invalid-argument', 'Winner must be a player in the match.');
            }
            const prizeAmount = matchData.fee * matchData.playerCount * 0.9; // 10% rake
            user_repository_1.userRepository.updateWalletBalance(transaction, result.winnerId, prizeAmount, 'winnings');
            const resultData = {
                status: 'completed',
                winnerId: result.winnerId,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            };
            match_repository_1.matchRepository.submitResult(transaction, matchId, resultData);
            return { success: true };
        });
    }
    async cancelMatch(userId, matchId) {
        return firebase_1.firestore.runTransaction(async (transaction) => {
            const matchDoc = await match_repository_1.matchRepository.getMatch(matchId);
            if (!matchDoc.exists) {
                throw new https_1.HttpsError('not-found', 'Match not found.');
            }
            const matchData = matchDoc.data();
            if (matchData.hostId !== userId) {
                throw new https_1.HttpsError('permission-denied', 'Only the host can cancel the match.');
            }
            if (matchData.status !== 'pending') {
                throw new https_1.HttpsError('failed-precondition', 'Cannot cancel a match that is not pending.');
            }
            if (matchData.playerCount > 1) {
                throw new https_1.HttpsError('failed-precondition', 'Cannot cancel a match once an opponent has joined.');
            }
            // Refund the host's fee
            user_repository_1.userRepository.updateWalletBalance(transaction, userId, matchData.fee, 'deposit');
            // Mark match as cancelled
            match_repository_1.matchRepository.cancelMatch(transaction, matchId);
            return { success: true };
        });
    }
}
exports.matchService = new MatchService();
//# sourceMappingURL=match.service.js.map