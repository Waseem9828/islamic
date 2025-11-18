
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { firestore, functions } from '@/firebase/config';
import { useUser } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, User, XCircle, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';

// Define the Cloud Function
const cancelMatchFunction = httpsCallable(functions, 'cancelMatch');

export default function MatchLobbyPage() {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const matchId = params.id as string;

  const [match, setMatch] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!matchId) return;

    const matchRef = doc(firestore, 'matches', matchId);
    const unsubscribe = onSnapshot(matchRef, (docSnap) => {
      if (docSnap.exists()) {
        setMatch(docSnap.data());
      } else {
        toast.error('Match not found.');
        router.push('/play');
      }
      setLoading(false);
    }, (error) => {
      console.error('Error listening to match document:', error);
      toast.error('Failed to load match details.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [matchId, router]);

  const handleCancelMatch = async () => {
    if (!user || !match || user.uid !== match.createdBy) return;

    setIsCancelling(true);
    try {
      const result = await cancelMatchFunction({ matchId });
      if (result.data.status === 'success') {
        toast.success('Match Cancelled', { description: 'Your entry fee has been refunded.' });
        // The listener will automatically update the status to 'cancelled'
      } else {
          throw new Error('Failed to cancel match');
      }
    } catch (error: any) {
      console.error('Error cancelling match:', error);
      toast.error('Cancellation failed.', { description: error.message || 'An unknown error occurred.' });
    } finally {
      setIsCancelling(false);
    }
  };

  const isCreator = user && match && user.uid === match.createdBy;
  const canCancel = isCreator && match?.status === 'waiting' && match?.players.length === 1;

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!match) {
    return <div className="text-center py-10">Match not found.</div>;
  }

  if (match.status === 'cancelled') {
      return (
          <div className="container mx-auto max-w-lg text-center py-10">
              <Card className="border-t-4 border-red-500">
                  <CardHeader>
                      <XCircle className="mx-auto h-12 w-12 text-red-500"/>
                      <CardTitle className="mt-4 text-2xl">Match Cancelled</CardTitle>
                      <CardDescription>This match has been cancelled. Your entry fee has been refunded.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button onClick={() => router.push('/play')}><ArrowLeft className="mr-2 h-4 w-4"/> Back to Play</Button>
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>{match.matchTitle}</CardTitle>
          <CardDescription>Room Code: <span className="font-bold text-primary">{match.id}</span></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div><p className="text-sm text-muted-foreground">Entry Fee</p><p className="font-bold text-lg">₹{match.entry}</p></div>
            <div><p className="text-sm text-muted-foreground">Status</p><Badge variant={match.status === 'waiting' ? 'secondary' : 'default'}>{match.status}</Badge></div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Players ({match.players.length}/{match.maxPlayers})</h3>
            <div className="space-y-3">
              {match.players.map((playerId: string) => {
                  const player = match.playerInfo[playerId];
                  return (
                    <div key={playerId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center">
                        <Avatar className="h-9 w-9 mr-3">
                          <AvatarImage src={player.photoURL} alt={player.name} />
                          <AvatarFallback>{player.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span>{player.name}</span>
                        {match.createdBy === playerId && <ShieldCheck className="ml-2 h-5 w-5 text-green-500" title="Creator"/>}
                      </div>
                      <Badge variant="outline">{player.isReady ? 'Ready' : 'Not Ready'}</Badge>
                    </div>
                  )
              })}
            </div>
          </div>
          {canCancel && (
            <Button variant="destructive" onClick={handleCancelMatch} disabled={isCancelling} className="w-full">
              {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4"/>}
              Cancel Match & Refund Fee
            </Button>
          )}
           {/* Placeholder for Ready button */}
           <Button className="w-full" disabled={match.status !== 'waiting'}>
              <CheckCircle className="mr-2 h-4 w-4"/> Ready to Start
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
