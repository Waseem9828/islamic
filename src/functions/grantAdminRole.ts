
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

export const grantAdminRole = functions.https.onRequest(async (req, res) => {
  const userId = "Mh28D81npYYDfC3z8mslVIPFu5H3";
  try {
    await db.collection("roles_admin").doc(userId).set({ isAdmin: true });
    res.status(200).send(`Successfully granted admin role to user ${userId}`);
  } catch (error) {
    console.error(`Error granting admin role: ${error}`);
    res.status(500).send("Error granting admin role.");
  }
});
