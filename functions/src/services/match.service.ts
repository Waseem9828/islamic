
import { HttpsError } from 'firebase-functions/v2/https';
import { firestore } from '../firebase';
import { matchRepository } from '../repositories/match.repository';
import { userRepository } from '../repositories/user.repository';
import { FieldValue } from 'firebase-admin/firestore';

class MatchService {
    async createMatch(userId: string, fee: number) {
        return firestore.runTransaction(async (transaction) => {
            if (fee <= 0) {
                throw new HttpsError('invalid-argument', 'Match fee must be positive.');
            }
            const matchData = {
                fee,
                hostId: userId,
                players: [userId],
                playerCount: 1,
                status: 'pending',
                createdAt: FieldValue.serverTimestamp(),
            };
            const matchId = matchRepository.createMatch(transaction, matchData);
            userRepository.updateWalletBalance(transaction, userId, -fee, 'deposit');
            return { matchId };
        });
    }

    async joinMatch(userId: string, matchId: string) {
         return firestore.runTransaction(async (transaction) => {
            const matchDoc = await matchRepository.getMatch(matchId);
            if (!matchDoc.exists) {
                throw new HttpsError('not-found', 'Match not found.');
            }
            const matchData = matchDoc.data()!;
            if (matchData.players.includes(userId)) {
                throw new HttpsError('already-exists', 'You have already joined this match.');
            }
            if (matchData.status !== 'pending') {
                throw new HttpsError('failed-precondition', 'Match is not open for joining.');
            }
            matchRepository.joinMatch(transaction, matchId, userId, matchData.fee);
            userRepository.updateWalletBalance(transaction, userId, -matchData.fee, 'deposit');
            return { matchId };
        });
    }

    async submitResult(userId: string, matchId: string, result: { winnerId: string }) {
        return firestore.runTransaction(async (transaction) => {
            const matchDoc = await matchRepository.getMatch(matchId);
            if (!matchDoc.exists) {
                throw new HttpsError('not-found', 'Match not found.');
            }
            const matchData = matchDoc.data()!;
            
            if (matchData.status !== 'pending') {
                throw new HttpsError('failed-precondition', 'Match has already concluded.');
            }

            if (!matchData.players.includes(userId)) {
                throw new HttpsError('permission-denied', 'Only players can submit results.');
            }

            if (!matchData.players.includes(result.winnerId)) {
                throw new HttpsError('invalid-argument', 'Winner must be a player in the match.');
            }

            const prizeAmount = matchData.fee * matchData.playerCount * 0.9; // 10% rake
            userRepository.updateWalletBalance(transaction, result.winnerId, prizeAmount, 'winnings');
            
            const resultData = {
                status: 'completed',
                winnerId: result.winnerId,
                updatedAt: FieldValue.serverTimestamp(),
            };
            matchRepository.submitResult(transaction, matchId, resultData);

            return { success: true };
        });
    }

    async cancelMatch(userId: string, matchId: string) {
        return firestore.runTransaction(async (transaction) => {
            const matchDoc = await matchRepository.getMatch(matchId);
            if (!matchDoc.exists) {
                throw new HttpsError('not-found', 'Match not found.');
            }
            const matchData = matchDoc.data()!;

            if (matchData.hostId !== userId) {
                throw new HttpsError('permission-denied', 'Only the host can cancel the match.');
            }

            if (matchData.status !== 'pending') {
                throw new HttpsError('failed-precondition', 'Cannot cancel a match that is not pending.');
            }

            if (matchData.playerCount > 1) {
                throw new HttpsError('failed-precondition', 'Cannot cancel a match once an opponent has joined.');
            }

            // Refund the host's fee
            userRepository.updateWalletBalance(transaction, userId, matchData.fee, 'deposit');
            
            // Mark match as cancelled
            matchRepository.cancelMatch(transaction, matchId);

            return { success: true };
        });
    }
}

export const matchService = new MatchService();
