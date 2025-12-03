
import { onCall } from 'firebase-functions/v2/https';
import { matchService } from '../services/match.service';
import { ensureAuthenticated } from '../services/auth.service';
import { HttpsError } from 'firebase-functions/v2/https';

const region = 'asia-south1';

export const createMatch = onCall({ region, cors: true }, async (request) => {
    const userId = await ensureAuthenticated(request);
    const { fee } = request.data;
    if (typeof fee !== 'number') throw new HttpsError('invalid-argument', 'Fee must be a number.');
    return await matchService.createMatch(userId, fee);
});

export const joinMatch = onCall({ region, cors: true }, async (request) => {
    const userId = await ensureAuthenticated(request);
    const { matchId } = request.data;
    if (!matchId) throw new HttpsError('invalid-argument', 'Match ID is required.');
    return await matchService.joinMatch(userId, matchId);
});

export const submitResult = onCall({ region, cors: true }, async (request) => {
    const userId = await ensureAuthenticated(request);
    const { matchId, result } = request.data;
    if (!matchId || !result) throw new HttpsError('invalid-argument', 'Match ID and result are required.');
    return await matchService.submitResult(userId, matchId, result);
});

export const cancelMatch = onCall({ region, cors: true }, async (request) => {
    const userId = await ensureAuthenticated(request);
    const { matchId } = request.data;
    if (!matchId) throw new HttpsError('invalid-argument', 'Match ID is required.');
    return await matchService.cancelMatch(userId, matchId);
});
