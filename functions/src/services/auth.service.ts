
import { HttpsError } from "firebase-functions/v2/https";
import { firestore } from '../firebase';

// In-memory cache for admin roles for ultra-fast subsequent checks.
// This is a simple, high-performance cache.
const adminCache = new Map<string, { role: string; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Ensures the calling user is at least a worker admin.
 * Uses a high-performance in-memory cache to minimize DB reads.
 * 
 * @param {any} context - The function context containing auth information.
 * @returns {Promise<string>} The admin's UID.
 * @throws {HttpsError} If the user is not authenticated or not an admin.
 */
export const ensureWorkerAdmin = async (request: { auth?: { uid: string } }): Promise<string> => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Authentication required.");
    }
    const uid = request.auth.uid;
    const now = Date.now();

    // 1. Check high-speed cache first
    if (adminCache.has(uid) && (now - adminCache.get(uid)!.timestamp) < CACHE_TTL_MS) {
        const cachedAdmin = adminCache.get(uid)!;
        if (['worker', 'super'].includes(cachedAdmin.role)) {
            return uid; // Return from cache instantly
        }
    }

    // 2. If not in cache, read from Firestore
    const adminDoc = await firestore.collection("admins").doc(uid).get();
    const adminData = adminDoc.data();

    if (!adminData || !['worker', 'super'].includes(adminData.role)) {
        throw new HttpsError("permission-denied", "Admin privileges required.");
    }

    // 3. Update the cache for subsequent requests
    adminCache.set(uid, { role: adminData.role, timestamp: now });

    return uid;
};
