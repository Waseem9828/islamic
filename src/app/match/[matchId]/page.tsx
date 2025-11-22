
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useUser, useFirebase } from '@/firebase/provider';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import { Crown, Swords, Users, Clock, IndianRupee, LogIn, LogOut, CheckCircle, Hourglass, ShieldCheck, Gamepad2, Copy } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Player {
  uid: string;
  name: string;
  photoURL?: string;
  isReady: boolean;
}

interface MatchData {
  id: string;
  matchTitle: string;
  entry: number;
  maxPlayers: number;
  privacy: 'public' | 'private';
  timeLimit: string;
  status: string;
  createdBy: string;
  creatorName: string;
  players: string[];
  playerInfo: { [uid: string]: { name: string; photoURL?: string; isReady?: boolean } };
}

export default function MatchLobbyPage() {
  const { matchId } = useParams();
  const { user } = useUser();
  const { firestore } = useFirebase();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId || !firestore) return;

    const matchRef = doc(firestore, 'matches', matchId as string);
    const unsubscribe = onSnapshot(matchRef, (docSnap) => {
      if (docSnap.exists()) {
        setMatch({ id: docSnap.id, ...docSnap.data() } as MatchData);
      } else {
        setError('Match not found.');
        toast.error('Match not found');
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching match:", err);
      setError('Failed to load match details.');
      toast.error('Error loading match');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [matchId, firestore]);

  const handleJoinLeave = async (action: 'join' | 'leave') => {
    if (!user || !match || !firestore) return;
    const matchRef = doc(firestore, 'matches', match.id);
    const playerInfoPayload = { name: user.displayName, photoURL: user.photoURL, isReady: false };

    try {
        if (action === 'join') {
            await updateDoc(matchRef, {
                players: arrayUnion(user.uid),
                [`playerInfo.${user.uid}`]: playerInfoPayload
            });
            toast.success('Joined the match!');
        } else {
            await updateDoc(matchRef, {
                players: arrayRemove(user.uid),
                [`playerInfo.${user.uid}`]: undefined // Firestore way to remove a map key
            });
            toast.info('You left the match.');
        }
    } catch (err) {
        console.error(`Error ${action}ing match:`, err);
        toast.error(`Failed to ${action} the match.`);
    }
  };
  
  const handleReadyToggle = async () => {
    if (!user || !match || !firestore) return;
    const matchRef = doc(firestore, 'matches', match.id);
    const currentReadyStatus = match.playerInfo[user.uid]?.isReady || false;
    try {
      await updateDoc(matchRef, { [`playerInfo.${user.uid}.isReady`]: !currentReadyStatus });
      toast.success(`You are now ${!currentReadyStatus ? 'Ready' : 'Not Ready'}`);
    } catch (error) {
      console.error("Error updating ready status:", error);
      toast.error("Couldn\'t update status.");
    }
  };

  const handleOpenLudoKing = () => {
    if (!match) return;
    // This uses a deep link to open Ludo King with the room code
    window.location.href = `ludoking://?room_code=${match.id}`;
  };

  const handleCopyCode = () => {
    if (!match) return;
    navigator.clipboard.writeText(match.id);
    toast.success("Room Code Copied!");
  };

  const isUserInMatch = user && match?.players.includes(user.uid);
  const isCreator = user && match?.createdBy === user.uid;
  const allPlayersReady = match && match.players.length > 1 && match.players.every(p => match.playerInfo[p]?.isReady);

  if (loading) return <div className="flex justify-center items-center h-screen"><Hourglass className="animate-spin h-8 w-8" /></div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;
  if (!match) return <div className="flex justify-center items-center h-screen">Match not found.</div>;

  const playersList: Player[] = match.players.map(uid => ({
      uid,
      name: match.playerInfo[uid]?.name || 'Unknown Player',
      photoURL: match.playerInfo[uid]?.photoURL,
      isReady: match.playerInfo[uid]?.isReady || false,
  }));

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Card className="border-t-4 border-primary">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold flex items-center"><Swords className="mr-2" />{match.matchTitle}</CardTitle>
            <Badge variant={match.privacy === 'public' ? 'secondary' : 'destructive'}>{match.privacy}</Badge>
          </div>
          <CardDescription>Created by: <span className="font-semibold text-foreground">{match.creatorName}</span></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">Entry Fee</p><p className="font-bold text-lg flex items-center justify-center"><IndianRupee className="h-4 w-4 mr-1"/>{match.entry}</p></div>
                <div className="p-3 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">Max Players</p><p className="font-bold text-lg flex items-center justify-center"><Users className="h-4 w-4 mr-1"/>{match.maxPlayers}</p></div>
                <div className="p-3 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">Time Limit</p><p className="font-bold text-lg flex items-center justify-center"><Clock className="h-4 w-4 mr-1"/>{match.timeLimit}</p></div>
                <div className="p-3 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">Status</p><p className="font-bold text-lg">{match.status}</p></div>
            </div>

            {isUserInMatch && (
              <Card className="bg-green-500/10 border-green-500/30">
                  <CardHeader>
                      <CardTitle className="text-lg flex items-center"><Gamepad2 className="mr-2 text-green-700"/>Start Playing!</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                       <div className="text-center space-y-1">
                            <Label className="text-muted-foreground">Room Code</Label>
                            <div className="p-3 bg-muted rounded-lg border-2 border-dashed flex justify-between items-center">
                                <p className="text-2xl font-bold tracking-[0.2em]">{match.id}</p>
                                <Button size="icon" variant="ghost" onClick={handleCopyCode}><Copy className="h-5 w-5"/></Button>
                            </div>
                        </div>
                      <Button onClick={handleOpenLudoKing} className="w-full bg-green-600 hover:bg-green-700">
                          Play on Ludo King
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">This will open the Ludo King app. Make sure you have it installed.</p>
                  </CardContent>
              </Card>
            )}

          <div>
            <h3 className="text-lg font-semibold mb-3">Players ({match.players.length}/{match.maxPlayers})</h3>
            <Progress value={(match.players.length / match.maxPlayers) * 100} className="mb-4" />
            <div className="space-y-3">
              {playersList.map((player) => (
                <div key={player.uid} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={player.photoURL} alt={player.name} />
                      <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold flex items-center">
                            {player.name} 
                            {match.createdBy === player.uid && <Crown className="ml-2 h-4 w-4 text-yellow-500" title="Match Creator"/>}
                        </p>
                        <p className="text-xs text-muted-foreground">@{player.uid.substring(0, 6)}</p>
                    </div>
                  </div>
                  {player.isReady ? 
                    <Badge className="bg-green-500 text-white"><CheckCircle className="mr-1 h-3 w-3"/>Ready</Badge> : 
                    <Badge variant="outline">Not Ready</Badge>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {!isUserInMatch ? (
              <Button onClick={() => handleJoinLeave('join')} className="w-full"><LogIn className="mr-2 h-4 w-4"/>Join Match</Button>
            ) : (
              <>
                <Button onClick={handleReadyToggle} className="w-full" variant={match.playerInfo[user!.uid]?.isReady ? 'secondary' : 'default'}>
                    {match.playerInfo[user!.uid]?.isReady ? 'Set as Not Ready' : <><CheckCircle className="mr-2 h-4 w-4"/>Set as Ready</>}
                </Button>
                <Button onClick={() => handleJoinLeave('leave')} variant="destructive" className="w-full"><LogOut className="mr-2 h-4 w-4"/>Leave Match</Button>
              </>
            )}
          </div>
          
          {isCreator && (
            <Card className="bg-blue-900/10 border-blue-500/30">
                <CardHeader><CardTitle className="text-lg flex items-center"><ShieldCheck className="mr-2"/>Creator Controls</CardTitle></CardHeader>
                <CardContent>
                    <Button disabled={!allPlayersReady} className="w-full bg-green-600 hover:bg-green-700">Start Match</Button>
                    <p className="text-xs text-muted-foreground mt-2">Match can start when at least 2 players are ready.</p>
                </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
