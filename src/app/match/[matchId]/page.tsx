
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useUser, useFirebase } from '@/firebase/provider';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { Crown, Swords, Users, Clock, IndianRupee, LogIn, LogOut, CheckCircle, Hourglass, ShieldCheck, Gamepad2, Copy, UserPlus, X, Play, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { errorEmitter, FirestorePermissionError } from '@/firebase/errors';


interface Player {
  uid: string;
  name: string;
  photoURL?: string;
  isReady: boolean;
}

interface MatchData {
  id: string;
  matchTitle: string;
  entryFee: number;
  maxPlayers: number;
  privacy: 'public' | 'private';
  timeLimit: string;
  status: string;
  createdBy: string;
  creatorName: string;
  players: string[];
  playerInfo: { [uid: string]: { name: string; photoURL?: string; isReady?: boolean } };
}

const PlayerSlot = ({ player, isCreator }: { player: Player | null, isCreator: boolean }) => {
    if (!player) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg h-40">
                <UserPlus className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Empty Slot</span>
            </div>
        )
    }
    
    return (
         <div className={cn("relative flex flex-col items-center justify-center gap-2 p-4 border rounded-lg h-40 transition-all", player.isReady ? 'border-green-500 bg-green-500/10' : 'border-border')}>
            {isCreator && <Crown className="absolute top-2 right-2 h-5 w-5 text-yellow-500" />}
            <Avatar className="h-16 w-16 border-2">
                <AvatarImage src={player.photoURL} alt={player.name} />
                <AvatarFallback>{player.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-center truncate w-full">{player.name}</p>
            {player.isReady ? 
                <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs"><CheckCircle className="mr-1 h-3 w-3"/>Ready</Badge> : 
                <Badge variant="outline" className='text-xs'>Not Ready</Badge>
            }
        </div>
    )
}

export default function MatchLobbyPage() {
  const { matchId } = useParams();
  const router = useRouter();
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
        const matchData = { id: docSnap.id, ...docSnap.data() } as MatchData;
        setMatch(matchData);
         if (matchData.status === 'inprogress' && user && matchData.players.includes(user.uid)) {
            handleLudoKingRedirect(matchData.id);
        }
      } else {
        setError('Match not found.');
        toast.error('Match not found');
        router.push('/matchmaking');
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching match:", err);
      setError('Failed to load match details.');
      toast.error('Error loading match');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [matchId, firestore, router, user]);

  const handleJoinLeave = async (action: 'join' | 'leave') => {
    if (!user || !match || !firestore) return;
    const matchRef = doc(firestore, 'matches', match.id);
    
    if (action === 'join') {
        if (match.players.length >= match.maxPlayers) {
            toast.error("Match is full.");
            return;
        }

        const playerInfoPayload = { name: user.displayName, photoURL: user.photoURL, isReady: false };
        const updateData = {
            players: arrayUnion(user.uid),
            [`playerInfo.${user.uid}`]: playerInfoPayload
        };

        // Non-blocking update with contextual error handling
        updateDoc(matchRef, updateData)
            .then(() => {
                toast.success('Joined the match!');
            })
            .catch(async (serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: matchRef.path,
                    operation: 'update',
                    requestResourceData: {
                        players: `arrayUnion('${user.uid}')`,
                        playerInfo: 'add new player info object',
                    },
                });
                errorEmitter.emit('permission-error', permissionError);
            });

    } else { // leave action
        try {
            if (isCreator && match.players.length === 1) {
                 await updateDoc(matchRef, { status: "cancelled" });
                 toast.info('You left and the match was cancelled.');
            } else {
                await updateDoc(matchRef, {
                    players: arrayRemove(user.uid),
                    [`playerInfo.${user.uid}`]: undefined // This will cause a delete operation
                });
                toast.info('You left the match.');
            }
        } catch (err) {
             console.error(`Error leaving match:`, err);
             toast.error(`Failed to leave the match.`);
        }
    }
  };
  
  const handleReadyToggle = async () => {
    if (!user || !match || !firestore) return;
    const matchRef = doc(firestore, 'matches', match.id);
    const currentReadyStatus = match.playerInfo[user.uid]?.isReady || false;
    try {
      await updateDoc(matchRef, { [`playerInfo.${user.uid}.isReady`]: !currentReadyStatus });
    } catch (error) {
      console.error("Error updating ready status:", error);
      toast.error("Couldn't update status.");
    }
  };

    const handleStartMatch = async () => {
        if (!user || !match || !firestore || !isCreator) return;
        const matchRef = doc(firestore, 'matches', match.id);
        try {
            await updateDoc(matchRef, { status: 'inprogress' });
            handleLudoKingRedirect(match.id);
        } catch (error) {
            console.error("Error starting match:", error);
            toast.error("Couldn't start the match.");
        }
    };
  
  const handleLudoKingRedirect = (code: string) => {
    const ludoKingURL = `ludoking://?join=${code}`;
    window.location.href = ludoKingURL;
    toast.info("Redirecting to Ludo King...");
  };

  const handleCopyCode = () => {
    if (!match) return;
    navigator.clipboard.writeText(match.id);
    toast.success("Room Code Copied!");
  };

  const isUserInMatch = user && match?.players.includes(user.uid);
  const isCreator = user && match?.createdBy === user.uid;
  const readyPlayerCount = match ? match.players.filter(p => match.playerInfo[p]?.isReady).length : 0;
  const allPlayersReady = match ? readyPlayerCount === match.players.length : false;
  const canStart = isCreator && match && match.players.length >= 2 && allPlayersReady;

  if (loading) return <div className="flex justify-center items-center h-[80vh]"><Hourglass className="animate-spin h-8 w-8 text-primary" /></div>;
  if (error) return <div className="flex justify-center items-center h-[80vh] text-red-500">Error: {error}</div>;
  if (!match) return <div className="flex justify-center items-center h-[80vh]">Match not found.</div>;

  const playersList: (Player | null)[] = Array.from({ length: match.maxPlayers }, (_, i) => {
      const uid = match.players[i];
      if (!uid) return null;
      return {
          uid,
          name: match.playerInfo[uid]?.name || 'Unknown',
          photoURL: match.playerInfo[uid]?.photoURL,
          isReady: match.playerInfo[uid]?.isReady || false,
      }
  });
  
  const totalPot = match.entryFee * match.players.length;

  return (
    <div className="p-4 max-w-lg mx-auto flex flex-col h-screen pb-20 md:pb-4"> 
      <div className="flex-grow overflow-y-auto">
        <div className="text-center mb-4">
            <h1 className="text-2xl font-bold">{match.matchTitle}</h1>
            <p className="text-sm text-muted-foreground">
                Created by <span className="font-semibold text-primary">{match.creatorName}</span>
            </p>
            <div className="mt-2 text-xl font-bold text-green-600">
                Total Prize: ₹{totalPot}
            </div>
        </div>
         <div className="grid grid-cols-4 gap-2 text-center text-xs mb-4">
            <div className="bg-muted p-2 rounded-lg"><span className='font-bold flex items-center justify-center gap-1'><IndianRupee className='h-3 w-3'/>{match.entryFee}</span><span className='text-muted-foreground'>Entry</span></div>
            <div className="bg-muted p-2 rounded-lg"><span className='font-bold flex items-center justify-center gap-1'><Users className='h-3 w-3'/>{match.players.length}/{match.maxPlayers}</span><span className='text-muted-foreground'>Players</span></div>
            <div className="bg-muted p-2 rounded-lg"><span className='font-bold flex items-center justify-center gap-1'><Clock className='h-3 w-3'/>{match.timeLimit}</span><span className='text-muted-foreground'>Time</span></div>
            <div className="bg-muted p-2 rounded-lg"><span className='font-bold flex items-center justify-center gap-1'>{match.privacy === 'private' ? <Lock className='h-3 w-3'/> : <Unlock className='h-3 w-3'/>}</span><span className='text-muted-foreground capitalize'>{match.privacy}</span></div>
        </div>


        <div className="grid grid-cols-2 gap-4 mb-4">
            {playersList.map((player, index) => (
                <PlayerSlot key={player?.uid || index} player={player} isCreator={player?.uid === match.createdBy} />
            ))}
        </div>

        {isUserInMatch && (
            <Card className="mb-4 bg-muted/50">
                <CardHeader className='p-3'>
                    <CardTitle className="text-base">Ludo King Room Code</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 flex gap-2">
                    <div className="p-3 bg-background rounded-lg border-2 border-dashed flex justify-between items-center flex-grow">
                        <p className="text-2xl font-bold tracking-[0.2em]">{match.id}</p>
                        <Button size="icon" variant="ghost" onClick={handleCopyCode}><Copy className="h-5 w-5"/></Button>
                    </div>
                    <Button onClick={() => handleLudoKingRedirect(match.id)} className='h-auto bg-green-600 hover:bg-green-700 flex-col gap-1 px-4'>
                        <Gamepad2 className="h-6 w-6"/>
                        <span className="text-xs">Play</span>
                    </Button>
                </CardContent>
            </Card>
        )}

        {isUserInMatch && match.status === 'waiting' && <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
                When all players are ready, the creator can start the match.
            </AlertDescription>
        </Alert>}
        
        {match.status === 'cancelled' && <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertDescription>
                This match has been cancelled.
            </AlertDescription>
        </Alert>}
      </div>


      {/* Sticky Action Bar */}
      <div className="py-2 mt-auto">
          <div className="max-w-lg mx-auto grid grid-cols-2 gap-2">
            {!isUserInMatch ? (
                <Button size="lg" onClick={() => handleJoinLeave('join')} className="col-span-2 text-base h-12" disabled={match.players.length >= match.maxPlayers || match.status !== 'waiting'}>
                    <LogIn className="mr-2 h-5 w-5"/>Join Match
                </Button>
            ) : (
                match.status === 'waiting' ? (
                 <>
                    {isCreator && (
                        <Button size="lg" onClick={handleStartMatch} disabled={!canStart} className="text-base h-12 bg-green-600 hover:bg-green-700">
                           <Play className="mr-2 h-5 w-5"/> Start Match
                        </Button>
                    )}
                    
                    <Button size="lg" onClick={handleReadyToggle} className={cn("text-base h-12", isCreator ? '' : 'col-span-2')} variant={match.playerInfo[user!.uid]?.isReady ? 'secondary' : 'default'}>
                        <CheckCircle className="mr-2 h-5 w-5"/>{match.playerInfo[user!.uid]?.isReady ? 'Set Not Ready' : 'Set Ready'}
                    </Button>

                     {(!isCreator || (isCreator && match.players.length === 1)) && (
                         <Button size="lg" variant="destructive" onClick={() => handleJoinLeave('leave')} className={cn(isCreator ? 'col-span-2' : '')}>
                             <LogOut className="mr-2 h-5 w-5"/>
                             {isCreator ? 'Cancel Match' : 'Leave Match'}
                         </Button>
                    )}
                </>
                ) : (
                    <Button size="lg" onClick={() => router.push(`/result/${match.id}`)} className="col-span-2 text-base h-12">
                        Submit Result
                    </Button>
                )
            )}
        </div>
      </div>
    </div>
  );
}

    