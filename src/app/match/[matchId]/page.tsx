
'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteField } from 'firebase/firestore';
import { useUser, useFirebase, useDoc } from '@/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
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

// Interfaces
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
  playerInfo?: { [uid: string]: { name: string; photoURL?: string; isReady?: boolean } };
  results?: { [uid: string]: any };
}

// Helper Components
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

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = (reader.result as string).split(',')[1];
        resolve(result);
    };
    reader.onerror = error => reject(error);
});


const ResultSubmission = ({ match }: { match: MatchData }) => {
    const { user } = useUser();
    const { app } = useFirebase();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resultStatus, setResultStatus] = useState<'win' | 'lose' | null>(null);
    const [screenshot, setScreenshot] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setScreenshot(e.target.files[0]);
        }
    };

    const handleSubmitResult = async () => {
        if (!user || !match || !resultStatus || !screenshot || !app) {
            toast.error("Please select your status and upload a screenshot.");
            return;
        }
        setIsSubmitting(true);

        try {
            const functions = getFunctions(app, 'us-east1');
            const submitResult = httpsCallable(functions, 'submitResult');

            const screenshotBase64 = await fileToBase64(screenshot);
            const position = resultStatus === 'win' ? 1 : match.players.length;

            const response = await submitResult({ 
                matchId: match.id, 
                position, 
                screenshotBase64, 
            });

            toast.success("Result submitted successfully!", {
                description: `Your result is now under review.`,
            });
        } catch (error: any) {
            console.error("Error submitting result:", error);
            toast.error("Submission failed.", { description: error.message || "Could not save result." });
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
            <CardDescription>The match is complete. Report your result and upload proof.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label className="text-base font-semibold">1. Select Your Result</Label>
                     <RadioGroup onValueChange={(v) => setResultStatus(v as 'win' | 'lose')} className={`mt-2 grid grid-cols-2 gap-4`}>
                        <Label htmlFor="status-win" className="flex flex-col items-center justify-center space-y-2 p-4 border rounded-lg hover:bg-muted cursor-pointer has-[:checked]:bg-green-100 has-[:checked]:border-green-500">
                            <RadioGroupItem value="win" id="status-win" className='sr-only' />
                            <span className="text-3xl">🏆</span>
                            <span className="font-bold text-lg text-green-600">I Won</span>
                        </Label>
                        <Label htmlFor="status-lose" className="flex flex-col items-center justify-center space-y-2 p-4 border rounded-lg hover:bg-muted cursor-pointer has-[:checked]:bg-red-100 has-[:checked]:border-red-500">
                            <RadioGroupItem value="lose" id="status-lose" className='sr-only' />
                             <span className="text-3xl">🏳️</span>
                            <span className="font-bold text-lg text-red-600">I Lost</span>
                        </Label>
                    </RadioGroup>
                </div>

                <div>
                    <Label className="text-base font-semibold">2. Upload Result Screenshot</Label>
                    <div 
                        className="mt-2 flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                            {screenshot ? (
                                <p className="font-semibold text-green-600">{screenshot.name}</p>
                            ) : (
                                <>
                                    <p className="mb-2 text-sm text-muted-foreground">
                                        <span className="font-semibold">Click to upload</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">PNG or JPG</p>
                                </>
                            )}
                        </div>
                        <Input
                            ref={fileInputRef}
                            id="screenshot-upload"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg"
                        />
                    </div>
                </div>

                 <Button onClick={handleSubmitResult} disabled={isSubmitting || !resultStatus || !screenshot} className="w-full text-lg py-6">
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Submitting...</> : 'Confirm & Submit Result'}
                 </Button>
            </CardContent>
         </Card>
    )
}

// Main Match Lobby Component
export default function MatchLobbyPage() {
  const { matchId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { firestore } = useFirebase();

  const matchRef = useMemo(() => {
    if (!firestore || !matchId) return null;
    return doc(firestore, 'matches', matchId as string);
  }, [firestore, matchId]);

  const { data: match, isLoading: loading, error } = useDoc<MatchData>(matchRef);

   const handleReadyToggle = async () => {
    if (!user || !match || !firestore || !match.playerInfo) return;
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
        const allPlayersReady = match.players.every(p => match.playerInfo![p]?.isReady);
        if (!allPlayersReady) {
            toast.error("Not all players are ready.");
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
  
  if (loading) return <div className="flex justify-center items-center h-[80vh]"><Hourglass className="animate-spin h-8 w-8 text-primary" /></div>;
  if (error) return <div className="flex justify-center items-center h-[80vh] text-red-500">Error: {error.message}</div>;
  if (!match) return <div className="flex justify-center items-center h-[80vh]">Match not found.</div>;
  
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
            <div className="bg-muted p-2 rounded-lg"><span className='font-bold flex items-center justify-center gap-1'>{match.privacy === 'private' ? <Lock className='h-3 w-3'/> : <Unlock className='h-3 w-3'/> }</span><span className='text-muted-foreground capitalize'>{match.privacy}</span></div>
        </div>

        {match.status === 'waiting' &&
            <div className="grid grid-cols-2 gap-4 mb-4">
                {Array.from({ length: match.maxPlayers }, (_, i) => {
                    const playerUid = match.players[i];
                    const player = playerUid ? { uid: playerUid, ...match.playerInfo![playerUid] } : null;
                    return <PlayerSlot key={player?.uid || i} player={player as Player} isCreator={!!player && player.uid === match.createdBy} />
                })}
            </div>
        }

        {match.status === 'cancelled' && <Alert variant="destructive"><X className="h-4 w-4" /><AlertDescription>This match has been cancelled.</AlertDescription></Alert>}
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

      <div className="py-2 mt-auto">
          <div className="max-w-lg mx-auto grid grid-cols-1 gap-2">
              {user && isUserInMatch && match.status === 'waiting' && (
                <Button size="lg" onClick={handleReadyToggle} className='text-base h-12' variant={match.playerInfo?.[user.uid]?.isReady ? 'secondary' : 'default'}>
                    <CheckCircle className="mr-2 h-5 w-5"/>
                    {match.playerInfo?.[user.uid]?.isReady ? 'Set Not Ready' : 'Set Ready'}
                </Button>
            )}
            {isCreator && match.status === 'waiting' && (
                <Button size="lg" onClick={handleStartMatch} disabled={!match.players.every(p => match.playerInfo![p]?.isReady)} className="text-base h-12 bg-green-600 hover:bg-green-700">
                   <Play className="mr-2 h-5 w-5"/> Start Match
                </Button>
            )}
        </div>
      </div>
    </div>
  );
}

