"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// In functions/src/index.ts
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
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
const wrapInCors = (handler) => {
    return regionalFunctions.https.onRequest((req, res) => {
        corsHandler(req, res, async () => {
            if (req.method !== 'POST') {
                res.status(405).send('Method Not Allowed');
                return;
            }
            try {
                // Re-introducing the auth logic
                let auth = undefined;
                const authorization = req.headers.authorization;
                if (authorization && authorization.startsWith('Bearer ')) {
                    const idToken = authorization.split('Bearer ')[1];
                    try {
                        const decodedToken = await admin.auth().verifyIdToken(idToken);
                        auth = {
                            uid: decodedToken.uid,
                            token: idToken
                        };
                    }
                    catch (error) {
                        console.error("Error verifying ID token:", error);
                        // Not treating as a hard error for now, just logging it.
                        // The function can then decide what to do if auth is undefined.
                    }
                }
                const context = {
                    auth: auth,
                    instanceIdToken: req.headers['firebase-instance-id-token'],
                    rawRequest: req,
                };
                const result = await handler(req.body.data, context);
                res.status(200).json({ data: result });
            }
            catch (error) {
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
