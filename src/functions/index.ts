

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();
const regionalFunctions = functions.region("us-east1");

// =====================================================================
//  Helper Functions
// =====================================================================

const isAdmin = async (uid: string): Promise<boolean> => {
  if (!uid) return false;
  try {
    const adminDoc = await db.collection("roles_admin").doc(uid).get();
    return adminDoc.exists;
  } catch (error) {
    console.error(`Error checking admin status for UID: ${uid}`, error);
    return false;
  }
};

const ensureAuthenticated = (context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated.",
    );
  }
};

const ensureAdmin = async (context: functions.https.CallableContext) => {
  ensureAuthenticated(context);
  const userIsAdmin = await isAdmin(context.auth!.uid);
  if (!userIsAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "This function must be called by an admin.",
    );
  }
};


// =====================================================================
//  Callable Functions
// =====================================================================

export const submitResult = regionalFunctions.https.onCall(async (data, context) => {
    ensureAuthenticated(context);
    const uid = context.auth!.uid;
    const { matchId, position, screenshotBase64 } = data;

    if (!matchId || !position || !screenshotBase64) {
        throw new functions.https.HttpsError("invalid-argument", "Required fields (matchId, position, screenshotBase64) are missing.");
    }

    const matchRef = db.collection('matches').doc(matchId);
    const matchDoc = await matchRef.get();
    if (!matchDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Match not found.');
    }

    const bucket = admin.storage().bucket();
    const fileName = `results/${matchId}-${uid}-${Date.now()}.png`;
    const file = bucket.file(fileName);
    const buffer = Buffer.from(screenshotBase64, 'base64');
    
    await file.save(buffer, { 
        metadata: { 
            contentType: 'image/png',
            metadata: { userId: uid, matchId: matchId }
        } 
    });
    
    const [screenshotUrl] = await file.getSignedUrl({ action: 'read', expires: '03-09-2491' });

    const resultData = {
        userId: uid,
        position,
        screenshotUrl,
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'Pending Verification', // Status for manual admin review
    };

    await matchRef.update({ [`results.${uid}`]: resultData });

    return { success: true, message: 'Result submitted and is awaiting admin review.' };
});


export const listResultSubmissions = regionalFunctions.https.onCall(async (_, context) => {
    await ensureAdmin(context);

    try {
        const inProgressMatches = await db.collection('matches').where('status', '==', 'inprogress').get();
        let submissions: any[] = [];

        for (const matchDoc of inProgressMatches.docs) {
            const match = matchDoc.data();
            if (match.results) {
                const matchSubmissions = Object.keys(match.results).map(userId => {
                    const result = match.results[userId];
                    return {
                        id: `${matchDoc.id}-${userId}`,
                        matchId: matchDoc.id,
                        userId: userId,
                        userName: match.playerInfo[userId]?.name || 'Unknown',
                        screenshotURL: result.screenshotUrl,
                        selectedPosition: result.position,
                        prize: match.players.length * match.entryFee * 0.9, 
                        submittedAt: result.submittedAt.toDate().toISOString(),
                        status: result.status
                    };
                });
                submissions = submissions.concat(matchSubmissions);
            }
        }
        return submissions.filter(s => s.status === 'Pending Verification');
    } catch (error) {
        console.error('Error listing result submissions:', error);
        throw new functions.https.HttpsError('internal', 'Failed to list result submissions.');
    }
});


export const analyzeStorage = regionalFunctions.https.onCall(async (_, context) => {
    await ensureAdmin(context);
    const bucket = admin.storage().bucket();
    try {
        const [files] = await bucket.getFiles();
        let totalSize = 0;
        const fileDetails = files.map(file => {
            const sizeBytes = parseInt(file.metadata.size as string, 10);
            totalSize += sizeBytes;
            return {
                name: file.name,
                sizeKB: parseFloat((sizeBytes / 1024).toFixed(2)),
            };
        });

        return {
            totalFiles: files.length,
            totalSizeMB: parseFloat((totalSize / (1024 * 1024)).toFixed(2)),
            files: fileDetails.sort((a, b) => b.sizeKB - a.sizeKB),
        };
    } catch (error) {
        console.error('Error analyzing storage:', error);
        throw new functions.https.HttpsError('internal', 'Failed to analyze storage bucket.');
    }
});

const deleteFilesByPrefix = async (prefix: string) => {
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles({ prefix });
    let deletedCount = 0;
    const deletePromises: Promise<any>[] = [];
    files.forEach(file => {
        deletePromises.push(file.delete());
        deletedCount++;
    });
    await Promise.all(deletePromises);
    return deletedCount;
};

export const cleanupDepositScreenshots = regionalFunctions.https.onCall(async (_, context) => {
    await ensureAdmin(context);
    try {
        const deletedFilesCount = await deleteFilesByPrefix('deposit-screenshots/');
        return { success: true, deletedFilesCount };
    } catch (error) {
        console.error('Error cleaning deposit screenshots:', error);
        throw new functions.https.HttpsError('internal', 'Failed to clean up deposit screenshots.');
    }
});

export const cleanupWinningScreenshots = regionalFunctions.https.onCall(async (_, context) => {
    await ensureAdmin(context);
    try {
        const deletedFilesCount = await deleteFilesByPrefix('results/');
        return { success: true, deletedFilesCount };
    } catch (error) {
        console.error('Error cleaning winning screenshots:', error);
        throw new functions.https.HttpsError('internal', 'Failed to clean up winning screenshots.');
    }
});

export const cleanupProfilePictures = regionalFunctions.https.onCall(async (_, context) => {
    await ensureAdmin(context);
    try {
        const deletedFilesCount = await deleteFilesByPrefix('profile-pictures/');
        return { success: true, deletedFilesCount };
    } catch (error) {
        console.error('Error cleaning profile pictures:', error);
        throw new functions.https.HttpsError('internal', 'Failed to clean up profile pictures.');
    }
});
