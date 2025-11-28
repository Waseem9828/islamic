
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useUser, useFirebase } from '@/firebase/provider';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { Crown, Swords, Users, Clock, IndianRupee, LogIn, LogOut, CheckCircle, Hourglass, ShieldCheck, Gamepad2, Copy, UserPlus, X, Play, Lock, Unlock, Upload, Info, Trophy, List, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { errorEmitter, FirestorePermissionError } from '@/firebase/errors';


interface Player {
  uid: string;
  name: string;
  photoURL?: string;
  isReady: boolean;
}

interface MatchData {
  id: string;
  ludoKingRoomCode?: string;
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
  results?: { [uid: string]: any };
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

const calculateWinnings = (totalPool: number, playerCount: number): { position: number; prize: number }[] => {
    const commission = totalPool * 0.10;
    const netPool = totalPool - commission;
    // Simplified prize structure
    switch (playerCount) {
        case 2: return [{ position: 1, prize: Math.floor(netPool) }, { position: 2, prize: 0 }];
        case 3: return [{ position: 1, prize: Math.floor(netPool * 0.7) }, { position: 2, prize: Math.floor(netPool * 0.3) }, { position: 3, prize: 0 }];
        case 4: return [{ position: 1, prize: Math.floor(netPool * 0.6) }, { position: 2, prize: Math.floor(netPool * 0.3) }, { position: 3, prize: Math.floor(netPool * 0.1) }, { position: 4, prize: 0 }];
        default: return [];
    }
};

const ResultSubmission = ({ match }: { match: MatchData }) => {
    const router = useRouter();
    const { user } = useUser();
    const { firestore, storage } = useFirebase();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
    const [screenshot, setScreenshot] = useState<File | null>(null);

    const prizeDistribution = useMemo(() => {
        if (!match) return [];
        const playerCount = match.players.length;
        const totalPool = match.entryFee * playerCount;
        return calculateWinnings(totalPool, playerCount);
    }, [match]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setScreenshot(e.target.files[0]);
    };

    const handleSubmitResult = async () => {
        if (!user || !match || !selectedPosition || !screenshot || !storage || !firestore) {
            toast.error("Please fill all fields and upload a screenshot.");
            return;
        }
        setIsSubmitting(true);

        try {
            const screenshotRef = ref(storage, `results/${match.id}/${user.uid}/${Date.now()}`);
            const uploadResult = await uploadBytes(screenshotRef, screenshot);
            const screenshotUrl = await getDownloadURL(uploadResult.ref);

            const matchRef = doc(firestore, 'matches', match.id);
            const winning = prizeDistribution.find(p => p.position === parseInt(selectedPosition))?.prize || 0;

            const resultData = {
                position: parseInt(selectedPosition),
                screenshotUrl,
                submittedAt: new Date(),
                status: 'Pending Verification',
                estimatedWinnings: winning
            };

            await updateDoc(matchRef, { 
                [`results.${user.uid}`]: resultData,
            });

            toast.success("Result submitted successfully!", {
                description: `Position: ${selectedPosition}. Est. Winning: ₹${winning}. Results are under review.`,
            });
            // Don't redirect, stay on page to see submission status
        } catch (error) {
            console.error("Error submitting result:", error);
            toast.error("Submission failed.", { description: "Could not upload screenshot or save result." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (match.results && match.results[user!.uid]) {
        return (
            <Alert variant="default" className='mt-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'>
                <Trophy className="h-4 w-4 text-green-600"/>
                <AlertTitle className="text-green-800 dark:text-green-300">Result Submitted</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400">
                    You have already submitted your result for this match. It is currently under review by an admin.
                </AlertDescription>
            </Alert>
        )
    }

    return (
         <Card className="border-t-4 border-yellow-500 mt-6">
            <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold"><Trophy className="mr-2 h-5 w-5" /> Submit Your Result</CardTitle>
            <CardDescription>The match is complete. Report your final position and upload proof.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label className="text-base font-semibold">1. Select Your Position</Label>
                    <RadioGroup onValueChange={setSelectedPosition} className={`mt-2 grid grid-cols-2 gap-4`}>
                    {prizeDistribution.map(item => (
                        <Label key={item.position} htmlFor={`pos-${item.position}`} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                        <RadioGroupItem value={String(item.position)} id={`pos-${item.position}`} />
                        <span className="font-semibold">{item.position}{item.position === 1 ? 'st' : item.position === 2 ? 'nd' : item.position === 3 ? 'rd' : 'th'}</span>
                        <span className={`text-sm ${item.prize > 0 ? 'text-green-600' : 'text-red-600'} font-bold ml-auto`}>{item.prize > 0 ? `Win ₹${item.prize}` : 'No Win'}</span>
                        </Label>
                    ))}
                    </RadioGroup>
                </div>

                <div>
                    <Label htmlFor="screenshot-upload" className="text-base font-semibold">2. Upload Result Screenshot</Label>
                    <div className="mt-2"><Label htmlFor="screenshot-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted"><div className="flex flex-col items-center justify-center pt-5 pb-6"><Upload className="w-8 h-8 mb-3 text-muted-foreground" />{screenshot ? <p className="font-semibold text-green-600">{screenshot.name}</p> : <><p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p><p className="text-xs text-muted-foreground">PNG or JPG</p></>}</div><Input id="screenshot-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg" /></Label></div> 
                </div>

                 <Button onClick={handleSubmitResult} disabled={isSubmitting || !selectedPosition || !screenshot} className="w-full text-lg py-6">{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Submitting...</> : 'Confirm & Submit Result'}</Button>
            </CardContent>
         </Card>
    )
}

const RoomCodeManager = ({ match }: { match: MatchData }) => {
    const { firestore } = useFirebase();
    const [roomCode, setRoomCode] = useState(match.ludoKingRoomCode || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveCode = async () => {
        if (!roomCode || roomCode.length < 4) {
            toast.error("Invalid Code", { description: "Please enter a valid Ludo King room code." });
            return;
        }
        setIsSaving(true);
        const matchRef = doc(firestore!, 'matches', match.id);
        try {
            await updateDoc(matchRef, { ludoKingRoomCode: roomCode });
            toast.success("Room Code Saved!");
        } catch (error) {
            console.error("Error saving room code:", error);
            toast.error("Could not save room code.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyCode = () => {
        if (!match.ludoKingRoomCode) return;
        navigator.clipboard.writeText(match.ludoKingRoomCode);
        toast.success("Room Code Copied!");
    };
    
    const handleLudoKingRedirect = () => {
        if (!match.ludoKingRoomCode) return;
        const ludoKingURL = `ludoking://?join=${match.ludoKingRoomCode}`;
        window.location.href = ludoKingURL;
        toast.info("Redirecting to Ludo King...");
    };

    // View for the match creator
    return (
        <Card className="mb-4 bg-muted/50">
            <CardHeader className='p-3'>
                <CardTitle className="text-base">Ludo King Room Code</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 flex gap-2">
                <div className="flex-grow">
                    <Input 
                        placeholder="Enter Ludo King Code"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        maxLength={8}
                        className="font-mono tracking-widest text-lg text-center"
                    />
                </div>
                <Button onClick={handleSaveCode} disabled={isSaving} size="icon" className="h-auto px-4">
                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                </Button>
            </CardContent>
            {match.ludoKingRoomCode && (
                <CardContent className="p-3 pt-0 flex gap-2">
                     <div className="p-3 bg-background rounded-lg border-2 border-dashed flex justify-between items-center flex-grow">
                        <p className="text-2xl font-bold tracking-[0.2em]">{match.ludoKingRoomCode}</p>
                        <Button size="icon" variant="ghost" onClick={handleCopyCode}><Copy className="h-5 w-5"/></Button>
                    </div>
                    <Button onClick={handleLudoKingRedirect} className='h-auto bg-green-600 hover:bg-green-700 flex-col gap-1 px-4'>
                        <Gamepad2 className="h-6 w-6"/>
                        <span className="text-xs">Play</span>
                    </Button>
                </CardContent>
            )}
        </Card>
    );
};

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
                    [`playerInfo.${user.uid}`]: undefined 
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
        if (!match.ludoKingRoomCode) {
            toast.error("Please enter the Ludo King room code before starting.");
            return;
        }
        const matchRef = doc(firestore, 'matches', match.id);
        try {
            await updateDoc(matchRef, { status: 'inprogress' });
            toast.success("Match Started! Good luck.");
        } catch (error) {
            console.error("Error starting match:", error);
            toast.error("Couldn't start the match.");
        }
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
                Match ID: <span className="font-semibold text-primary font-mono">{match.id}</span>
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

        {match.status === 'waiting' &&
            <div className="grid grid-cols-2 gap-4 mb-4">
                {playersList.map((player, index) => (
                    <PlayerSlot key={player?.uid || index} player={player} isCreator={player?.uid === match.createdBy} />
                ))}
            </div>
        }

        {isCreator && match.status === 'waiting' && <RoomCodeManager match={match} />}

        {isUserInMatch && !isCreator && match.status === 'waiting' && (
            <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                    {match.ludoKingRoomCode 
                        ? `The Ludo King room code is: ${match.ludoKingRoomCode}`
                        : "Waiting for the creator to share the Ludo King room code."
                    }
                </AlertDescription>
            </Alert>
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

        {isUserInMatch && match.status === 'inprogress' && <ResultSubmission match={match} />}
        {match.status === 'completed' && (
             <Alert variant="default" className='mt-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'>
                <Trophy className="h-4 w-4 text-blue-600"/>
                <AlertTitle className="text-blue-800 dark:text-blue-300">Match Completed</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-400">
                    This match has been completed and verified by an admin. Winnings have been distributed.
                </AlertDescription>
            </Alert>
        )}
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
                   <div className='col-span-2'>
                        {/* The result submission form is shown above */}
                   </div>
                )
            )}
        </div>
      </div>
    </div>
  );
}
