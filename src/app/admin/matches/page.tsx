
'use client';

import { useState, useMemo } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase/provider';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Crown, Trophy, Clock, Users, IndianRupee, ShieldCheck, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';

const MatchCard = ({ match, children }: { match: any, children?: React.ReactNode }) => {
    const statusConfig = {
        waiting: { className: "border-blue-500/30" },
        inprogress: { className: "border-orange-500/30" },
        completed: { className: "border-green-500/30", opacity: "opacity-80" },
        cancelled: { className: "border-red-500/30", opacity: "opacity-60" },
    }[match.status] || { className: "border-border" };

    return (
        <Card className={`p-4 ${statusConfig.className} ${statusConfig.opacity || ''}`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className="font-semibold">{match.matchTitle}</h4>
                    <p className="text-xs text-muted-foreground">ID: {match.id}</p>
                </div>
                <Badge variant={match.status === 'completed' ? 'default' : 'secondary'}>{match.status}</Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1 mb-3">
                <div className='flex justify-between'>
                    <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3"/>Entry: ₹{match.entry}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3"/>Players: {match.players.length}/{match.maxPlayers}</span>
                </div>
                <div className='flex justify-between'>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>Time: {match.timeLimit}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/>{format(match.createdAt.toDate(), 'PP')}</span>
                </div>
                {match.winner && (
                    <div className="flex items-center gap-1 pt-1 text-green-600 font-semibold">
                       <Trophy className="h-3 w-3"/> Winner: {match.playerInfo[match.winner]?.name || 'N/A'}
                    </div>
                )}
                 {match.status === 'cancelled' && (
                    <div className="flex items-center gap-1 pt-1 text-red-600 font-semibold">
                       <ShieldCheck className="h-3 w-3"/> Cancelled
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

  const distributeWinningsFunction = useMemo(() => {
    if (!functions) return null;
    return httpsCallable(functions, 'distributeWinnings');
  }, [functions]);

  const matchesQuery = useMemo(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'matches'), orderBy('createdAt', 'desc'));
    }, [firestore]);

  const [matchesSnapshot, loading, error] = useCollection(matchesQuery);

  const matches = useMemo(() => {
    if (!matchesSnapshot) return { waiting: [], inprogress: [], completed: [], cancelled: [] };
    const allMatches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return {
        waiting: allMatches.filter(m => m.status === 'waiting'),
        inprogress: allMatches.filter(m => m.status === 'inprogress'),
        completed: allMatches.filter(m => m.status === 'completed'),
        cancelled: allMatches.filter(m => m.status === 'cancelled'),
    };
  }, [matchesSnapshot]);

  const handleDeclareWinner = async (matchId: string) => {
    if (!distributeWinningsFunction) {
        toast.error('Functions service not ready.');
        return;
    }
    const winnerId = selectedWinner[matchId];
    if (!winnerId) {
      toast.error('Please select a winner for the match.');
      return;
    }

    setIsSubmitting(prev => ({ ...prev, [matchId]: true }));

    try {
      const result = await distributeWinningsFunction({ matchId, winnerId });
      const data = (result.data as any).result as { status: string, message: string };
      if (data.status === 'success') {
        toast.success('Winner Declared!', { 
          description: data.message,
        });
      } else {
        throw new Error(data.message || 'Failed to declare winner.');
      }
    } catch (err: any) {
      console.error('Error declaring winner:', err);
      toast.error('Operation Failed', { description: err.message || 'An unknown error occurred.' });
    } finally {
      setIsSubmitting(prev => ({ ...prev, [matchId]: false }));
    }
  };

  const renderMatchList = (matches: any[]) => {
      if (loading) {
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
                     <div className="flex flex-col sm:flex-row gap-2 mt-2">
                        <Select 
                            onValueChange={(value) => setSelectedWinner(prev => ({...prev, [match.id]: value}))}
                            value={selectedWinner[match.id] || ''}
                        >
                            <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select Winner" />
                            </SelectTrigger>
                            <SelectContent>
                            {match.players.map((playerId: string) => (
                                <SelectItem key={playerId} value={playerId}>
                                {match.playerInfo[playerId]?.name || playerId}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <Button 
                            onClick={() => handleDeclareWinner(match.id)}
                            disabled={isSubmitting[match.id] || !selectedWinner[match.id]}
                            className='flex-shrink-0 h-9'
                            size="sm"
                        >
                            {isSubmitting[match.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Crown className="mr-2 h-4 w-4"/>}
                            Declare
                        </Button>
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
          <CardDescription>Review all matches and declare winners for active ones.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="waiting">
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
