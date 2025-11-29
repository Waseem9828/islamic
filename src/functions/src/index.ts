// In functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors'; // Assuming you are using the 'cors' package

admin.initializeApp();

const regionalFunctions = functions.region('us-east1'); // Or your function's region

// Configure CORS middleware
const corsOptions: cors.CorsOptions = {
    origin: [
        "https://*.cloudworkstations.dev", // Wildcard for Firebase Studio previews
        "https://*.firebaseapp.com",
        "http://localhost:3000",
        // Add the specific URL if the wildcard doesn't work or for more strict control
        "https://9000-firebase-studio-1762409723230.cluster-52r6vzs3ujeoctkkxpjif3x34a.cloudworkstations.dev"
    ],
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'], // Include all methods your function handles
    allowedHeaders: ['Content-Type', 'Authorization'], // Add any custom headers you use
};

const corsHandler = cors(corsOptions);

const wrapInCors = (handler: (data: any, context: functions.https.CallableContext) => any) => {
    return regionalFunctions.https.onRequest((req, res) => {
        corsHandler(req, res, async () => { // Pass req, res, and the next function
            if (req.method !== 'POST') {
                res.status(405).send('Method Not Allowed');
                return;
            }
            try {
                // Manually construct the CallableContext
                const context: functions.https.CallableContext = {
                    auth: req.headers.authorization ? await admin.auth().verifyIdToken(req.headers.authorization.split('Bearer ')[1]) : undefined,
                    instanceIdToken: req.headers['firebase-instance-id-token'] as string | undefined,
                    rawRequest: req,
                };
                
                const result = await handler(req.body.data, context);
                // Ensure to send a response for the actual function call
                res.status(200).json({ data: result }); // Adjust based on your handler's expected output
            } catch (error) {
                console.error("Function execution error:", error);
                res.status(500).send("Internal Server Error");
            }
        });
    });
};

// Example usage (assuming requestDeposit is one of your handlers)
// export const requestDeposit = wrapInCors(async (data, context) => {
//     // Your function logic here
//     return { success: true, message: "Deposit requested" };
// });
