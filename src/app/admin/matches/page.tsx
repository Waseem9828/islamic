'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, getDoc, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase/provider';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Crown, Trophy, Clock, Users, IndianRupee, ShieldCheck, Calendar, Eye, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const statusConfig: any = {
    waiting: { className: "border-blue-500/30", label: "Waiting for Players" },
    inprogress: { className: "border-orange-500/30", label: "In Progress" },
    completed: { className: "border-green-500/30", label: "Completed", opacity: "opacity-80" },
    cancelled: { className: "border-red-500/30", label: "Cancelled", opacity: "opacity-60" },
};

const MatchCard = ({ match, children }: { match: any, children?: React.ReactNode }) => {
    const config = statusConfig[match.status] || { className: "border-border", label: match.status };

    return (
        <Card className={`p-4 flex flex-col justify-between ${config.className} ${config.opacity || ''}`}>
            <div>
                 <div className="flex justify-between items-start mb-2">
                    <div>
                        <Link href={`/match/${match.id}`} className="font-semibold hover:underline">{match.matchTitle || 'Untitled Match'}</Link>
                        <p className="text-xs text-muted-foreground font-mono">{match.id}</p>
                    </div>
                    <Badge variant={match.status === 'completed' ? 'default' : 'secondary'}>{config.label}</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 mb-3">
                    <div className='flex justify-between'>
                        <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3"/>Entry: ₹{match.entryFee}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3"/>Players: {match.players.length}/{match.maxPlayers}</span>
                    </div>
                    <div className='flex justify-between'>
                        <span className="flex items-center gap-1"><Trophy className="h-3 w-3"/>Prize: ₹{match.prize}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/>{format(match.createdAt.toDate(), 'PP')}</span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    {match.playersInfo.map((player: any) => (
                        <Link key={player.id} href={`/profile/${player.id}`} className="flex items-center gap-2 text-xs hover:bg-muted p-1 rounded-md">
                            <Avatar className="h-5 w-5">
                                <AvatarImage src={player.photoURL || `https://avatar.vercel.sh/${player.email}.png`} />
                                <AvatarFallback>{player.displayName?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <span>{player.displayName || player.email}</span>
                        </Link>
                    ))}
                </div>
                {match.winner && match.playersInfo.find((p:any) => p.id === match.winner) && (
                    <div className="flex items-center gap-1 pt-1 text-green-600 font-semibold text-sm">
                       <Trophy className="h-4 w-4"/> Winner: {match.playersInfo.find((p:any) => p.id === match.winner).displayName}
                    </div>
                )}
                 {match.status === 'cancelled' && (
                    <div className="flex items-center gap-1 pt-1 text-red-600 font-semibold text-sm">
                       <ShieldCheck className="h-4 w-4"/> Cancelled by Admin
                    </div>
                )}
            </div>
            {children}
        </Card>
    )
}

export default function ManageMatchesPage() {
  const { firestore, functions } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [selectedWinner, setSelectedWinner] = useState<Record<string, string>>({});

  const distributeWinningsFunction = useMemo(() => functions ? httpsCallable(functions, 'distributeWinnings') : null, [functions]);
  const cancelMatchFunction = useMemo(() => functions ? httpsCallable(functions, 'cancelMatch') : null, [functions]);

  const matchesQuery = useMemo(() => firestore ? query(collection(firestore, 'matches'), orderBy('createdAt', 'desc')) : null, [firestore]);

  const [matchesSnapshot, loading, error] = useCollection(matchesQuery);

  const [matchesWithPlayers, setMatchesWithPlayers] = useState<any[]>([]);

  useEffect(() => {
    if (!matchesSnapshot || !firestore) return;

    const fetchPlayerData = async () => {
      const allMatches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const enhancedMatches = await Promise.all(allMatches.map(async (match) => {
        const playersInfo = await Promise.all(match.players.map(async (playerId: string) => {
          const userDoc = await getDoc(doc(firestore, 'users', playerId));
          return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : { id: playerId, name: 'Unknown' };
        }));
        return { ...match, playersInfo };
      }));
      setMatchesWithPlayers(enhancedMatches);
    };

    fetchPlayerData();
  }, [matchesSnapshot, firestore]);


  const matches = useMemo(() => {
    const allMatches = matchesWithPlayers;
    return {
        waiting: allMatches.filter(m => m.status === 'waiting'),
        inprogress: allMatches.filter(m => m.status === 'inprogress'),
        completed: allMatches.filter(m => m.status === 'completed'),
        cancelled: allMatches.filter(m => m.status === 'cancelled'),
    };
  }, [matchesWithPlayers]);

  const handleDeclareWinner = async (matchId: string) => {
    if (!distributeWinningsFunction) return toast.error('Functions service not ready.');
    const winnerId = selectedWinner[matchId];
    if (!winnerId) return toast.error('Please select a winner.');

    setIsSubmitting(prev => ({ ...prev, [matchId]: true }));
    try {
      const result = await distributeWinningsFunction({ matchId, winnerId });
      const data = (result.data as any).result as { status: string, message: string };
      if (data.status === 'success') toast.success('Winner Declared!', { description: data.message });
      else throw new Error(data.message || 'Failed to declare winner.');
    } catch (err: any) {
      toast.error('Operation Failed', { description: err.message || 'Unknown error.' });
    } finally {
      setIsSubmitting(prev => ({ ...prev, [matchId]: false }));
    }
  };
  
  const handleCancelMatch = async (matchId: string) => {
    if (!cancelMatchFunction) return toast.error('Functions service not ready.');
    setIsSubmitting(prev => ({ ...prev, [`cancel-${matchId}`]: true }));
    try {
        await cancelMatchFunction({ matchId });
        toast.success('Match Cancelled', { description: 'The match has been successfully cancelled and funds returned.' });
    } catch (err: any) {
        toast.error('Cancellation Failed', { description: err.message || 'An unknown error occurred.' });
    } finally {
        setIsSubmitting(prev => ({ ...prev, [`cancel-${matchId}`]: false }));
    }
  };

  const renderMatchList = (matches: any[]) => {
      if (loading && matchesWithPlayers.length === 0) {
        return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><Card><CardContent className='p-4'><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card></div>;
      }
      if (matches.length === 0) {
        return <p className="text-center text-muted-foreground py-6 col-span-full">No matches in this category.</p>
      }
      return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map(match => (
                  <MatchCard key={match.id} match={match}>
                      { (match.status === 'waiting' || match.status === 'inprogress') && (
                         <div className="space-y-2">
                            <Select 
                                onValueChange={(value) => setSelectedWinner(prev => ({...prev, [match.id]: value}))}
                                value={selectedWinner[match.id] || ''}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select Winner" />
                                </SelectTrigger>
                                <SelectContent>
                                    {match.playersInfo.map((player: any) => (
                                        <SelectItem key={player.id} value={player.id}>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={player.photoURL || `https://avatar.vercel.sh/${player.email}.png`} />
                                                    <AvatarFallback>{player.displayName?.[0] || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <span>{player.displayName || player.email}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <div className="flex gap-2">
                                <Button onClick={() => handleDeclareWinner(match.id)} disabled={isSubmitting[match.id] || !selectedWinner[match.id]} className='w-full' size="sm">
                                    {isSubmitting[match.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Crown className="mr-2 h-4 w-4"/>}
                                    Declare
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" disabled={isSubmitting[`cancel-${match.id}`]} className="w-full">
                                            {isSubmitting[`cancel-${match.id}`] ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4"/>}
                                            Cancel
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will cancel the match and refund the entry fee to all players. This action cannot be undone.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Back</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleCancelMatch(match.id)}>Confirm</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                 <Link href={`/match/${match.id}`}>
                                    <Button variant="outline" size="sm" className="w-full"><Eye className="mr-2 h-4 w-4"/> View</Button>
                                </Link>
                            </div>
                        </div>
                      )}
                  </MatchCard>
              ))}
          </div>
      );
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error loading matches: {error.message}</div>;
  }

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Trophy className="mr-2"/> Manage All Matches</CardTitle>
          <CardDescription>Review all matches, declare winners, or cancel active games.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="waiting" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="waiting">Waiting ({matches.waiting.length})</TabsTrigger>
                    <TabsTrigger value="inprogress">In Progress ({matches.inprogress.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({matches.completed.length})</TabsTrigger>
                    <TabsTrigger value="cancelled">Cancelled ({matches.cancelled.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="waiting">{renderMatchList(matches.waiting)}</TabsContent>
                <TabsContent value="inprogress">{renderMatchList(matches.inprogress)}</TabsContent>
                <TabsContent value="completed">{renderMatchList(matches.completed)}</TabsContent>
                <TabsContent value="cancelled">{renderMatchList(matches.cancelled)}</TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
