
import { firestore } from '../firebase';
import { FieldValue } from 'firebase-admin/firestore';

class MatchRepository {
    private collection = firestore.collection('matches');

    getMatch(matchId: string) {
        return this.collection.doc(matchId).get();
    }

    createMatch(transaction: FirebaseFirestore.Transaction, matchData: any) {
        const docRef = this.collection.doc();
        transaction.create(docRef, matchData);
        return docRef.id;
    }

    joinMatch(transaction: FirebaseFirestore.Transaction, matchId: string, userId: string, fee: number) {
        const docRef = this.collection.doc(matchId);
        transaction.update(docRef, {
            players: FieldValue.arrayUnion(userId),
            playerCount: FieldValue.increment(1),
        });
    }

    submitResult(transaction: FirebaseFirestore.Transaction, matchId: string, resultData: any) {
        const docRef = this.collection.doc(matchId);
        transaction.update(docRef, resultData);
    }

    cancelMatch(transaction: FirebaseFirestore.Transaction, matchId: string) {
        const docRef = this.collection.doc(matchId);
        transaction.update(docRef, {
            status: 'cancelled',
            updatedAt: FieldValue.serverTimestamp(),
        });
    }
}

export const matchRepository = new MatchRepository();
