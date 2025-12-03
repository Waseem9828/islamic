
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useFirebase, useUser } from '@/firebase';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/loading';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Swords, Clock, IndianRupee, Crown, Copy, Share2, Trophy, Ban } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


const PlayerAvatar = ({ player, isWinner }) => (
    <div className="flex flex-col items-center space-y-2 relative">
        {isWinner && <Crown className="absolute -top-4 text-yellow-400 w-8 h-8"/>}
        <Avatar className={`h-16 w-16 border-4 ${isWinner ? 'border-yellow-400' : 'border-muted'}`}>
            <AvatarImage src={player?.photoURL} />
            <AvatarFallback>{player?.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
        <p className="font-semibold text-sm truncate w-24 text-center">{player?.name || 'Waiting...'}</p>
        {player?.isHost && !isWinner && <Badge variant="secondary" className="-mt-1">Host</Badge>}
    </div>
);

export default function MatchLobbyPage() {
    const { id: matchId } = useParams();
    const router = useRouter();
    const { firestore, functions } = useFirebase();
    const { user, isUserLoading } = useUser();

    const [match, setMatch] = useState<any>(null);
    const [playersInfo, setPlayersInfo] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [winnerToDeclare, setWinnerToDeclare] = useState<string | null>(null);
    const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);

    const joinMatchFn = useMemo(() => functions ? httpsCallable(functions, 'joinMatch') : null, [functions]);
    const submitResultFn = useMemo(() => functions ? httpsCallable(functions, 'submitResult') : null, [functions]);
    const cancelMatchFn = useMemo(() => functions ? httpsCallable(functions, 'cancelMatch') : null, [functions]);

    useEffect(() => {
        if (isUserLoading) return;
        if (!user) router.push('/login');
    }, [user, isUserLoading, router]);

    useEffect(() => {
        if (!firestore || !matchId) return;
        const matchRef = doc(firestore, 'matches', matchId as string);
        const unsubscribe = onSnapshot(matchRef, async (docSnap) => {
            if (docSnap.exists()) {
                const matchData = { id: docSnap.id, ...docSnap.data() };
                setMatch(matchData);
                
                if (matchData.status === 'cancelled') {
                    toast.info("This match has been cancelled.", { duration: 5000 });
                    router.push('/play');
                    return;
                }

                const playerIds = matchData.players || [];
                const fetchedPlayers = {};
                for (const pid of playerIds) {
                    if (!playersInfo[pid]) {
                        const userDoc = await doc(firestore, 'users', pid).get();
                        if (userDoc.exists()) fetchedPlayers[pid] = userDoc.data();
                    }
                }
                setPlayersInfo(prev => ({...prev, ...fetchedPlayers}));
            } else {
                toast.error("Match not found.");
                router.push('/play');
            }
            setIsLoading(false);
        }, err => {
            console.error(err);
            toast.error("Failed to load match details.");
            router.push('/play');
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, matchId, router, playersInfo]);

    const handleJoinMatch = async () => {
        if (!user || !joinMatchFn) return toast.error("Cannot join match right now.");
        setIsActionLoading(true);
        try {
            await joinMatchFn({ matchId });
            toast.success("Joined Match!");
        } catch (err: any) {
            toast.error("Failed to join match", { description: err.message });
        } finally {
            setIsActionLoading(false);
        }
    }

    const handleConfirmSubmitResult = async () => {
        if (!user || !submitResultFn || !winnerToDeclare) return;
        setIsActionLoading(true);
        try {
            await submitResultFn({ matchId, result: { winnerId: winnerToDeclare } });
            toast.success("Result submitted! Winner has been paid.");
        } catch (err: any) {
            toast.error("Failed to submit result", { description: err.message });
        } finally {
            setIsActionLoading(false);
            setWinnerToDeclare(null);
        }
    }
    
    const handleCancelMatch = async () => {
        if (!user || !cancelMatchFn) return;
        setIsActionLoading(true);
        try {
            await cancelMatchFn({ matchId });
            toast.success("Match Cancelled", { description: "Your entry fee has been refunded." });
            // The snapshot listener will redirect.
        } catch (err: any) {
            toast.error("Failed to cancel match", { description: err.message });
        } finally {
            setIsActionLoading(false);
            setIsCancelAlertOpen(false);
        }
    }
    
    const handleCopyCode = () => {
        navigator.clipboard.writeText(matchId as string);
        toast.success("Match ID Copied!");
    };

    const filledPlayers = useMemo(() => 
        (match?.players || []).map(pid => ({ 
            ...playersInfo[pid], 
            uid: pid, 
            isHost: pid === match.hostId 
        })).filter(p => p.name),
    [match, playersInfo]);

    const canJoin = useMemo(() => user && match && !match.players.includes(user.uid) && match.status === 'pending' && match.playerCount < 2, [user, match]);
    const canSubmitResult = useMemo(() => user && match && match.players.includes(user.uid) && match.status === 'pending' && match.playerCount === 2, [user, match]);
    const canCancel = useMemo(() => user && match && match.hostId === user.uid && match.status === 'pending' && match.playerCount === 1, [user, match]);

    if (isLoading || isUserLoading || !match) {
        return <LoadingScreen text="Entering lobby..." />
    }
    
    const winnerInfo = match.status === 'completed' && match.winnerId ? playersInfo[match.winnerId] : null;
    const HeaderIcon = match.status === 'completed' ? Trophy : match.status === 'cancelled' ? Ban : Swords;
    const headerIconColor = match.status === 'completed' ? 'text-yellow-400' : match.status === 'cancelled' ? 'text-red-500' : 'text-primary';

    return (
        <div className="container max-w-lg mx-auto p-4 space-y-4">
             <Card>
                <CardHeader className="text-center">
                     <HeaderIcon className={`mx-auto w-12 h-12 ${headerIconColor}`} />
                    <CardTitle>
                        {match.status === 'completed' ? 'Match Over' : 
                         match.status === 'cancelled' ? 'Match Cancelled' :
                         'Match Lobby'}
                    </CardTitle>
                    <CardDescription>
                         {match.status === 'completed' ? `Winner: ${winnerInfo?.name || '...'}` : 
                          match.status === 'cancelled' ? 'This match was cancelled.' :
                          match.playerCount === 2 ? 'Match is ready to start!' : 'Waiting for opponent...'}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="flex justify-around items-start pt-4">
                        <PlayerAvatar player={filledPlayers[0]} isWinner={match.winnerId === filledPlayers[0]?.uid} />
                        <div className="flex flex-col items-center text-muted-foreground pt-6"><Swords className="h-8 w-8"/><p className="text-xs font-semibold">VS</p></div>
                        <PlayerAvatar player={filledPlayers[1] || {}} isWinner={match.winnerId === filledPlayers[1]?.uid} />
                    </div>
                    
                     <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-center gap-2"><IndianRupee className="h-4 w-4 text-amber-500"/> Entry: <span className="font-bold">₹{match.fee}</span></div>
                        <div className="flex items-center gap-2"><Users className="h-4 w-4"/> Players: <span className="font-bold">{match.playerCount}/2</span></div>
                        <div className="flex items-center gap-2"><Crown className="h-4 w-4 text-yellow-500"/> Prize: <span className="font-bold">₹{match.fee * 2 * 0.9}</span></div>
                        <div className="flex items-center gap-2"><Clock className="h-4 w-4"/> Status: <Badge variant={match.status !== 'pending' ? 'default' : 'secondary'}>{match.status}</Badge></div>
                    </div>

                    {canJoin && (
                        <Button size="lg" className="w-full" onClick={handleJoinMatch} disabled={isActionLoading}>
                            {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            Join Match (Pay ₹{match.fee})
                        </Button>
                    )}

                    {canSubmitResult && (
                        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                           <CardHeader className='p-4'>
                               <CardTitle className="text-base">Declare Winner</CardTitle>
                               <CardDescription className="text-xs">Both players must be in agreement. False claims can lead to a ban.</CardDescription>
                           </CardHeader>
                           <CardContent className="p-4 pt-0 grid grid-cols-2 gap-2">
                                {filledPlayers.map(p => (
                                    <Button key={p.uid} variant="outline" onClick={() => setWinnerToDeclare(p.uid)} disabled={isActionLoading}>
                                        Declare {p.name} Winner
                                    </Button>
                                ))}
                           </CardContent>
                        </Card>
                    )}
                    
                    <div className="space-y-2">
                        {canCancel && (
                             <Button variant="destructive" className="w-full" onClick={() => setIsCancelAlertOpen(true)} disabled={isActionLoading}>
                                Cancel Match & Get Refund
                            </Button>
                        )}
                        {match.status === 'pending' && (
                            <div className="flex gap-2">
                                <Button onClick={handleCopyCode} variant="outline" className="w-full"><Copy className="mr-2 h-4 w-4"/>Copy Code</Button>
                                <Button onClick={() => navigator.share({ title: 'Join my Ludo Match', text: `Join my Ludo match with code: ${matchId}`, url: window.location.href })} variant="outline" className="w-full"><Share2 className="mr-2 h-4 w-4"/>Share</Button>
                            </div>
                        )}
                     </div>
                </CardContent>
            </Card>

            {/* Submit Result Dialog */}
            <AlertDialog open={!!winnerToDeclare} onOpenChange={(open) => !open && setWinnerToDeclare(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to declare <span className="font-bold">{playersInfo[winnerToDeclare]?.name}</span> as the winner. This action cannot be undone and will transfer the prize money.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmSubmitResult} disabled={isActionLoading}>
                             {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cancel Match Dialog */}
            <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will cancel the match and refund your entry fee. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No, keep it</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelMatch} disabled={isActionLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                             {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Yes, Cancel Match
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
