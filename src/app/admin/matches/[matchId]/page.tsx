
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useDoc, useFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Crown, Users, IndianRupee, Clock, Lock, Unlock, CheckCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface PlayerInfo {
    name: string;
    photoURL?: string;
    isReady: boolean;
}

interface MatchData {
    id: string;
    matchTitle: string;
    status: string;
    entryFee: number;
    maxPlayers: number;
    players: string[];
    playerInfo: { [key: string]: PlayerInfo };
    createdBy: string;
    creatorName: string;
    createdAt: { toDate: () => Date };
    winner?: string;
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
            {isCreator && <Crown className="absolute top-2 right-2 h-4 w-4 text-yellow-500" title="Creator" />}
            {isWinner && <ShieldCheck className="absolute top-2 left-2 h-4 w-4 text-green-500" title="Winner" />}
            <Avatar className="h-12 w-12">
                <AvatarImage src={info.photoURL} />
                <AvatarFallback>{info.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <Link href={`/admin/users/${uid}`} className="font-semibold hover:underline">{info.name}</Link>
                <p className="text-xs text-muted-foreground font-mono">{uid}</p>
                <Badge variant={info.isReady ? 'default' : 'outline'} className="mt-1">
                    <CheckCircle className="mr-1 h-3 w-3"/>{info.isReady ? 'Ready' : 'Not Ready'}
                </Badge>
            </div>
        </CardContent>
    </Card>
);

export default function AdminMatchDetailsPage() {
    const { matchId } = useParams();
    const router = useRouter();
    const { firestore } = useFirebase();

    const matchRef = useMemo(() => {
        if (!firestore || !matchId) return null;
        return doc(firestore, 'matches', matchId as string);
    }, [firestore, matchId]);

    const { data: match, isLoading } = useDoc<MatchData>(matchRef);
    
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

    if (!match) {
        return (
            <div>
                <Button onClick={() => router.back()} variant="ghost"><ArrowLeft className="mr-2 h-4 w-4"/> Back</Button>
                <p className="mt-4 text-center text-muted-foreground">Match not found.</p>
            </div>
        );
    }
    
    const prizePool = (match.entryFee || 0) * (match.players?.length || 0);

    return (
        <div className="space-y-6">
            <div>
                <Button onClick={() => router.back()} variant="outline" size="sm" className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4"/> Back to Matches
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-start">
                            <span>{match.matchTitle}</span>
                            <Badge variant={match.status === 'completed' ? 'default' : 'secondary'} className="capitalize text-base">{match.status}</Badge>
                        </CardTitle>
                        <CardDescription>
                            ID: {match.id} | Created on {format(match.createdAt.toDate(), 'PPp')}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Prize Pool" value={`₹${prizePool.toLocaleString()}`} icon={IndianRupee} />
                <StatCard label="Entry Fee" value={`₹${match.entryFee}`} icon={IndianRupee} />
                <StatCard label="Players" value={`${match.players.length} / ${match.maxPlayers}`} icon={Users} />
                 <StatCard label="Time Limit" value={match.timeLimit} icon={Clock} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Players</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    {match.players.map(uid => (
                        <PlayerCard 
                            key={uid} 
                            uid={uid} 
                            info={match.playerInfo[uid]} 
                            isCreator={uid === match.createdBy}
                            isWinner={uid === match.winner}
                        />
                    ))}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Match Details</CardTitle>
                </CardHeader>
                <CardContent>
                   <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-8">
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-muted-foreground">Creator</dt>
                            <dd className="mt-1 font-semibold">
                                <Link href={`/admin/users/${match.createdBy}`} className="hover:underline">{match.creatorName}</Link>
                            </dd>
                        </div>
                         <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-muted-foreground">Privacy</dt>
                            <dd className="mt-1 font-semibold capitalize flex items-center">
                                {match.privacy === 'private' ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
                                {match.privacy}
                            </dd>
                        </div>
                        {match.winner && (
                             <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-muted-foreground">Winner</dt>
                                <dd className="mt-1 font-semibold">
                                     <Link href={`/admin/users/${match.winner}`} className="hover:underline">{match.playerInfo[match.winner]?.name}</Link>
                                </dd>
                            </div>
                        )}
                        {match.winnings !== undefined && (
                             <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-muted-foreground">Winnings Paid</dt>
                                <dd className="mt-1 font-semibold text-green-600">₹{match.winnings.toLocaleString()}</dd>
                            </div>
                        )}
                   </dl>
                </CardContent>
            </Card>
        </div>
    );
}
