"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureWorkerAdmin = exports.ensureAuthenticated = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_1 = require("../firebase");
// In-memory cache for admin roles for ultra-fast subsequent checks.
// This is a simple, high-performance cache.
const adminCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
/**
 * Ensures the calling user is authenticated.
 *
 * @param {any} request - The function context containing auth information.
 * @returns {Promise<string>} The user's UID.
 * @throws {HttpsError} If the user is not authenticated.
 */
const ensureAuthenticated = async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    }
    return request.auth.uid;
};
exports.ensureAuthenticated = ensureAuthenticated;
/**
 * Ensures the calling user is at least a worker admin.
 * Uses a high-performance in-memory cache to minimize DB reads.
 *
 * @param {any} context - The function context containing auth information.
 * @returns {Promise<string>} The admin's UID.
 * @throws {HttpsError} If the user is not authenticated or not an admin.
 */
const ensureWorkerAdmin = async (request) => {
    const uid = await (0, exports.ensureAuthenticated)(request);
    const now = Date.now();
    // 1. Check high-speed cache first
    if (adminCache.has(uid) && (now - adminCache.get(uid).timestamp) < CACHE_TTL_MS) {
        const cachedAdmin = adminCache.get(uid);
        if (['worker', 'super'].includes(cachedAdmin.role)) {
            return uid; // Return from cache instantly
        }
    }
    // 2. If not in cache, read from Firestore
    const adminDoc = await firebase_1.firestore.collection("admins").doc(uid).get();
    const adminData = adminDoc.data();
    if (!adminData || !['worker', 'super'].includes(adminData.role)) {
        throw new https_1.HttpsError("permission-denied", "Admin privileges required.");
    }
    // 3. Update the cache for subsequent requests
    adminCache.set(uid, { role: adminData.role, timestamp: now });
    return uid;
};
exports.ensureWorkerAdmin = ensureWorkerAdmin;
//# sourceMappingURL=auth.service.js.map