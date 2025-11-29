// In functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
const cors = require('cors');

admin.initializeApp();

const regionalFunctions = functions.region('us-east1'); // Or your function's region

// Configure CORS middleware
const corsOptions = {
    origin: [
        "https://*.cloudworkstations.dev", // Wildcard for Firebase Studio previews
        "https://*.firebaseapp.com",
        "http://localhost:3000",
        "https://9000-firebase-studio-1762409723230.cluster-52r6vzs3ujeoctkkxpjif3x34a.cloudworkstations.dev"
    ],
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

const corsHandler = cors(corsOptions);

const wrapInCors = (handler: (data: any, context: functions.https.CallableContext) => any) => {
    return regionalFunctions.https.onRequest((req, res) => {
        corsHandler(req, res, async () => {
            if (req.method !== 'POST') {
                res.status(405).send('Method Not Allowed');
                return;
            }
            try {
                // Re-introducing the auth logic
                let auth: functions.https.AuthData | undefined = undefined;
                const authorization = req.headers.authorization;
                if (authorization && authorization.startsWith('Bearer ')) {
                    const idToken = authorization.split('Bearer ')[1];
                    try {
                        const decodedToken = await admin.auth().verifyIdToken(idToken);
                        auth = {
                            uid: decodedToken.uid,
                            token: idToken
                        };
                    } catch (error) {
                        console.error("Error verifying ID token:", error);
                        // Not treating as a hard error for now, just logging it.
                        // The function can then decide what to do if auth is undefined.
                    }
                }

                const context: functions.https.CallableContext = {
                    auth: auth,
                    instanceIdToken: req.headers['firebase-instance-id-token'] as string | undefined,
                    rawRequest: req,
                };
                
                const result = await handler(req.body.data, context);
                res.status(200).json({ data: result });
            } catch (error) {
                console.error("Function execution error:", error);
                res.status(500).send("Internal Server Error");
            }
        });
    });
};

// Example usage
// export const yourCloudFunction = wrapInCors(async (data, context) => {
//     if (!context.auth) {
//         throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
//     }
//     // Access authenticated user's info via context.auth.uid
//     return { success: true, uid: context.auth.uid };
// });
