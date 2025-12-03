
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useDoc, useFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { httpsCallable } from 'firebase/functions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Crown, Users, IndianRupee, Clock, Lock, Unlock, CheckCircle, ShieldCheck, AlertTriangle, Trophy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { toast } from 'sonner';

interface PlayerInfo {
    name: string;
    photoURL?: string;
    isReady: boolean;
}

interface Result {
    position: number;
    screenshotUrl: string;
    submittedAt: { toDate: () => Date };
    status: string;
}

interface GameData {
    id: string;
    gameTitle: string;
    status: 'waiting' | 'inprogress' | 'completed' | 'canceled' | 'disputed';
    entryFee: number;
    maxPlayers: number;
    players: string[];
    playerInfo: { [key: string]: PlayerInfo };
    results?: { [key: string]: Result };
    createdBy: string;
    creatorName: string;
    createdAt: { toDate: () => Date };
    winnerId?: string;
    winnings?: number;
    privacy: 'public' | 'private';
    timeLimit: string;
}


const StatCard = ({ label, value, icon: Icon }: { label: string, value: string | number, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const PlayerCard = ({ uid, info, isCreator, isWinner }: { uid: string, info: PlayerInfo, isCreator: boolean, isWinner: boolean }) => (
    <Card className={`relative ${isWinner ? 'border-2 border-green-500' : ''}`}>
        <CardContent className="p-4 flex items-center gap-4">
            {isCreator && <Crown className="absolute top-2 right-2 h-4 w-4 text-yellow-500" title="Game Creator" />}
            {isWinner && <ShieldCheck className="absolute -top-2 -left-2 h-5 w-5 text-green-500" title="Winner" />}
            <Avatar className="h-12 w-12">
                <AvatarImage src={info.photoURL} />
                <AvatarFallback>{info.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <Link href={`/admin/users/${uid}`} className="font-semibold hover:underline">{info.name}</Link>
                <p className="text-xs text-muted-foreground font-mono">{uid}</p>
                { info.isReady !== undefined && 
                    <Badge variant={info.isReady ? 'default' : 'outline'} className="mt-1">
                        <CheckCircle className="mr-1 h-3 w-3"/>{info.isReady ? 'Ready' : 'Not Ready'}
                    </Badge>
                }
            </div>
        </CardContent>
    </Card>
);

const DeclareWinnerDialog = ({ onConfirm, onCancel, playerName, isLoading }: { onConfirm: () => void; onCancel: () => void; playerName: string, isLoading: boolean }) => (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirm Winner</DialogTitle>
                <DialogDescription>Are you sure you want to declare <strong>{playerName}</strong> as the winner? This will end the game and distribute the winnings. This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline" onClick={onCancel}>Cancel</Button></DialogClose>
                <Button onClick={onConfirm} disabled={isLoading}>
                    {isLoading ? 'Processing...' : 'Confirm & Distribute Winnings'}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

export default function AdminGameDetailsPage() {
    const { gameId } = useParams();
    const router = useRouter();
    const { firestore, functions } = useFirebase();
    const [isWinnerDialog, setIsWinnerDialog] = useState<{ open: boolean; winnerId: string | null; winnerName: string | null }>({ open: false, winnerId: null, winnerName: null });
    const [isProcessing, setIsProcessing] = useState(false);

    const gameRef = useMemo(() => {
        if (!firestore || !gameId) return null;
        return doc(firestore, 'games', gameId as string);
    }, [firestore, gameId]);

    const { data: game, isLoading, error } = useDoc<GameData>(gameRef);

    const handleDeclareWinner = async () => {
        if (!functions || !isWinnerDialog.winnerId || !gameId) return;
        
        setIsProcessing(true);
        const toastId = toast.loading("Distributing winnings...");
        
        const distributeWinningsFn = httpsCallable(functions, 'distributeWinnings');
        try {
            await distributeWinningsFn({ gameId, winnerId: isWinnerDialog.winnerId });
            toast.success("Winner declared successfully!", { id: toastId });
            setIsWinnerDialog({ open: false, winnerId: null, winnerName: null });
        } catch (err: any) {
            toast.error("Failed to declare winner", { id: toastId, description: err.message });
        } finally {
            setIsProcessing(false);
        }
    };

    const openWinnerDialog = (winnerId: string, winnerName: string) => {
        setIsWinnerDialog({ open: true, winnerId, winnerName });
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-48" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
                </div>
                <Skeleton className="h-10 w-32" />
                <div className="space-y-4">
                    {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20" />)}
                </div>
            </div>
        );
    }

    if (!game || error) {
        return (
            <div>
                <Button onClick={() => router.back()} variant="ghost"><ArrowLeft className="mr-2 h-4 w-4"/> Back</Button>
                <p className="mt-4 text-center text-muted-foreground">{error ? `Error: ${error.message}`: 'Game not found.'}</p>
            </div>
        );
    }
    
    const prizePool = (game.entryFee || 0) * (game.players?.length || 0);
    const resultSubmissions = game.results ? Object.entries(game.results) : [];

    return (
        <div className="space-y-6">
             {isWinnerDialog.open && <DeclareWinnerDialog onConfirm={handleDeclareWinner} onCancel={() => setIsWinnerDialog({open: false, winnerId: null, winnerName: null})} playerName={isWinnerDialog.winnerName!} isLoading={isProcessing} />}
            <div>
                <Button onClick={() => router.back()} variant="outline" size="sm" className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4"/> Back to Games
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                            <span>{game.gameTitle}</span>
                            <Badge variant={game.status === 'completed' ? 'default' : 'secondary'} className="capitalize text-base">{game.status}</Badge>
                        </CardTitle>
                        <CardDescription>
                            ID: {game.id} | Created on {format(game.createdAt.toDate(), 'PPp')}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Prize Pool" value={`₹${prizePool.toLocaleString()}`} icon={IndianRupee} />
                <StatCard label="Entry Fee" value={`₹${game.entryFee}`} icon={IndianRupee} />
                <StatCard label="Players" value={`${game.players.length} / ${game.maxPlayers}`} icon={Users} />
                 <StatCard label="Time Limit" value={game.timeLimit} icon={Clock} />
            </div>
            
            {game.status === 'inprogress' && resultSubmissions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center'><Trophy className='mr-2'/>Result Submissions</CardTitle>
                        <CardDescription>Players have submitted their results. Review the screenshots and declare a winner.</CardDescription>
                    </CardHeader>
                    <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {resultSubmissions.map(([uid, result]) => (
                           <Card key={uid} className='flex flex-col'>
                               <CardHeader className='pb-2'>
                                   <div className='flex items-center gap-2'>
                                       <Avatar className="h-8 w-8">
                                            <AvatarImage src={game.playerInfo[uid]?.photoURL} />
                                            <AvatarFallback>{game.playerInfo[uid]?.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className='font-semibold text-sm'>{game.playerInfo[uid]?.name}</p>
                                            <p className={`text-sm font-bold ${result.position === 1 ? 'text-green-500' : 'text-red-500'}`}>
                                                Claimed: {result.position === 1 ? 'WINNER' : 'LOST'}
                                            </p>
                                        </div>
                                   </div>
                               </CardHeader>
                               <CardContent className='flex-grow flex flex-col justify-center items-center gap-2'>
                                    <a href={result.screenshotUrl} target="_blank" rel="noopener noreferrer" className='block w-full h-48 bg-muted rounded-md overflow-hidden relative group'>
                                        <img src={result.screenshotUrl} alt='Result screenshot' className='w-full h-full object-contain'/>
                                        <div className='absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                                            <ExternalLink className='h-6 w-6 text-white'/>
                                        </div>
                                    </a>
                                    <p className='text-xs text-muted-foreground pt-1'>Submitted: {format(result.submittedAt.toDate(), 'Pp')}</p>
                               </CardContent>
                                <CardFooter>
                                    <Button className='w-full' size='sm' onClick={() => openWinnerDialog(uid, game.playerInfo[uid]?.name)}>
                                        Declare as Winner
                                    </Button>
                               </CardFooter>
                           </Card>
                        ))}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Players</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    {game.players.map(uid => (
                        <PlayerCard 
                            key={uid} 
                            uid={uid} 
                            info={game.playerInfo[uid]} 
                            isCreator={uid === game.createdBy}
                            isWinner={uid === game.winnerId}
                        />
                    ))}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Game Details</CardTitle>
                </CardHeader>
                <CardContent>
                   <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-8">
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-muted-foreground">Creator</dt>
                            <dd className="mt-1 font-semibold">
                                <Link href={`/admin/users/${game.createdBy}`} className="hover:underline">{game.creatorName}</Link>
                            </dd>
                        </div>
                         <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-muted-foreground">Privacy</dt>
                            <dd className="mt-1 font-semibold capitalize flex items-center">
                                {game.privacy === 'private' ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
                                {game.privacy}
                            </dd>
                        </div>
                        {game.winnerId && (
                             <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-muted-foreground">Winner</dt>
                                <dd className="mt-1 font-semibold">
                                     <Link href={`/admin/users/${game.winnerId}`} className="hover:underline">{game.playerInfo[game.winnerId]?.name}</Link>
                                </dd>
                            </div>
                        )}
                        {game.winnings !== undefined && (
                             <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-muted-foreground">Winnings Paid</dt>
                                <dd className="mt-1 font-semibold text-green-600">₹{game.winnings.toLocaleString()}</dd>
                            </div>
                        )}
                   </dl>
                </CardContent>
            </Card>
        </div>
    );
}
