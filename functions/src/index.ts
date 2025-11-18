
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const MIN_ENTRY_FEE = 50;

exports.createMatch = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to create a match."
    );
  }

  const { matchId, matchTitle, entryFee, maxPlayers, privacy, timeLimit } = data;
  const userId = context.auth.uid;
  const userDisplayName = context.auth.token.name || "Anonymous";
  const userPhotoURL = context.auth.token.picture || null;

  if (typeof matchId !== 'string' || matchId.length < 4) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid Match ID.");
  }
  if (typeof entryFee !== 'number' || entryFee < MIN_ENTRY_FEE) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Entry fee must be at least ₹${MIN_ENTRY_FEE}.`
    );
  }

  const matchRef = db.collection("matches").doc(matchId.toUpperCase());
  const walletRef = db.collection("wallets").doc(userId);

  try {
    const newBalance = await db.runTransaction(async (transaction) => {
      const matchDoc = await transaction.get(matchRef);
      if (matchDoc.exists) {
        throw new functions.https.HttpsError("already-exists", "This room code already exists.");
      }

      const walletDoc = await transaction.get(walletRef);
      if (!walletDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Wallet not found.");
      }

      const walletData = walletDoc.data();
      const depositBalance = walletData.depositBalance || 0;
      const winningBalance = walletData.winningBalance || 0;
      const totalBalance = depositBalance + winningBalance;

      if (totalBalance < entryFee) {
        throw new functions.https.HttpsError("failed-precondition", "Insufficient balance.");
      }

      let newDepositBalance = depositBalance;
      let newWinningBalance = winningBalance;
      let deductedFromDeposit = 0;
      let deductedFromWinnings = 0;

      if (depositBalance >= entryFee) {
        newDepositBalance -= entryFee;
        deductedFromDeposit = entryFee;
      } else {
        const remainingFee = entryFee - depositBalance;
        newDepositBalance = 0;
        deductedFromDeposit = depositBalance;
        newWinningBalance -= remainingFee;
        deductedFromWinnings = remainingFee;
      }

      const newMatch = {
        id: matchId.toUpperCase(),
        room: matchId.toUpperCase(),
        matchTitle,
        entry: entryFee,
        maxPlayers,
        privacy,
        timeLimit,
        status: "waiting",
        createdBy: userId,
        creatorName: userDisplayName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        players: [userId],
        playerInfo: {
          [userId]: { name: userDisplayName, photoURL: userPhotoURL, isReady: false },
        },
      };
      transaction.set(matchRef, newMatch);

      transaction.update(walletRef, {
        depositBalance: newDepositBalance,
        winningBalance: newWinningBalance,
      });

      const txRef = db.collection("transactions").doc();
      transaction.set(txRef, {
        userId,
        type: "debit",
        amount: entryFee,
        reason: "match_creation",
        matchId: matchId.toUpperCase(),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        breakdown: {
            fromDeposit: deductedFromDeposit,
            fromWinnings: deductedFromWinnings,
        }
      });
      
      return { deposit: newDepositBalance, winning: newWinningBalance };
    });

    return {
      status: "success",
      message: "Match created successfully!",
      matchId: matchId.toUpperCase(),
      newBalance: newBalance,
    };

  } catch (error) {
    console.error("Transaction failed: ", error);
    if (error instanceof functions.https.HttpsError) {
        throw error;
    }
    throw new functions.https.HttpsError("internal", "An unexpected error occurred while creating the match.");
  }
});

exports.cancelMatch = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  }

  const { matchId } = data;
  const userId = context.auth.uid;

  if (typeof matchId !== 'string' || matchId.length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid Match ID.");
  }

  const matchRef = db.collection("matches").doc(matchId);
  const walletRef = db.collection("wallets").doc(userId);

  try {
    const newBalance = await db.runTransaction(async (transaction) => {
      const matchDoc = await transaction.get(matchRef);
      if (!matchDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Match not found.");
      }
      const matchData = matchDoc.data();

      if (matchData.createdBy !== userId) {
        throw new functions.https.HttpsError("permission-denied", "You are not the creator of this match.");
      }
      if (matchData.status !== "waiting" || matchData.players.length > 1) {
        throw new functions.https.HttpsError("failed-precondition", "Match cannot be cancelled. It may have started or other players have joined.");
      }

      const entryFee = matchData.entry;

      const creationTxQuery = await db.collection('transactions')
          .where('userId', '==', userId)
          .where('matchId', '==', matchId)
          .where('reason', '==', 'match_creation')
          .limit(1)
          .get();
      
      if (creationTxQuery.empty) {
          console.error(`Could not find original creation transaction for match ${matchId}. Refunding based on match entry fee.`);
      }

      const creationTxData = creationTxQuery.docs[0]?.data();
      const refundToDeposit = creationTxData?.breakdown?.fromDeposit || 0;
      const refundToWinnings = creationTxData?.breakdown?.fromWinnings || entryFee - (creationTxData?.breakdown?.fromDeposit || 0);

      const walletDoc = await transaction.get(walletRef);
      if (!walletDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Wallet not found.");
      }
      const walletData = walletDoc.data();
      
      const newDepositBalance = (walletData.depositBalance || 0) + refundToDeposit;
      const newWinningBalance = (walletData.winningBalance || 0) + refundToWinnings;
      
      transaction.update(walletRef, {
        depositBalance: newDepositBalance,
        winningBalance: newWinningBalance,
      });

      transaction.update(matchRef, { status: "cancelled" });

      const refundTxRef = db.collection("transactions").doc();
      transaction.set(refundTxRef, {
        userId,
        type: "credit",
        amount: entryFee,
        reason: "match_cancellation",
        matchId: matchId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        breakdown: {
            toDeposit: refundToDeposit,
            toWinnings: refundToWinnings,
        }
      });

      return { deposit: newDepositBalance, winning: newWinningBalance };
    });

    return {
        status: "success",
        message: "Match cancelled and fee refunded.",
        newBalance,
    };

  } catch (error) {
    console.error("Match cancellation failed: ", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError("internal", "An unexpected error occurred while cancelling the match.");
  }
});
