"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelMatch = exports.submitResult = exports.joinMatch = exports.createMatch = void 0;
const https_1 = require("firebase-functions/v2/https");
const match_service_1 = require("../services/match.service");
const auth_service_1 = require("../services/auth.service");
const https_2 = require("firebase-functions/v2/https");
const region = 'asia-south1';
exports.createMatch = (0, https_1.onCall)({ region, cors: true }, async (request) => {
    const userId = await (0, auth_service_1.ensureAuthenticated)(request);
    const { fee } = request.data;
    if (typeof fee !== 'number')
        throw new https_2.HttpsError('invalid-argument', 'Fee must be a number.');
    return await match_service_1.matchService.createMatch(userId, fee);
});
exports.joinMatch = (0, https_1.onCall)({ region, cors: true }, async (request) => {
    const userId = await (0, auth_service_1.ensureAuthenticated)(request);
    const { matchId } = request.data;
    if (!matchId)
        throw new https_2.HttpsError('invalid-argument', 'Match ID is required.');
    return await match_service_1.matchService.joinMatch(userId, matchId);
});
exports.submitResult = (0, https_1.onCall)({ region, cors: true }, async (request) => {
    const userId = await (0, auth_service_1.ensureAuthenticated)(request);
    const { matchId, result } = request.data;
    if (!matchId || !result)
        throw new https_2.HttpsError('invalid-argument', 'Match ID and result are required.');
    return await match_service_1.matchService.submitResult(userId, matchId, result);
});
exports.cancelMatch = (0, https_1.onCall)({ region, cors: true }, async (request) => {
    const userId = await (0, auth_service_1.ensureAuthenticated)(request);
    const { matchId } = request.data;
    if (!matchId)
        throw new https_2.HttpsError('invalid-argument', 'Match ID is required.');
    return await match_service_1.matchService.cancelMatch(userId, matchId);
});
//# sourceMappingURL=match.controller.js.map