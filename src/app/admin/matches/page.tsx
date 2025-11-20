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
import { Loader2, Crown, Trophy } from 'lucide-react';

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
      return query(
        collection(firestore, 'matches'), 
        where('status', 'in', ['waiting', 'inprogress']), 
        orderBy('createdAt', 'desc')
      );
    }, 
    [firestore]
  );

  const [matches, loading, error] = useCollection(matchesQuery);

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
      const data = result.data as { status: string, message: string };
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

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error loading matches: {error.message}</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Trophy className="mr-2"/> Manage Active Matches</CardTitle>
          <CardDescription>Declare a winner for completed matches. The prize money will be automatically distributed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {matches && matches.docs.length === 0 && (
            <p className="text-center text-muted-foreground py-6">No active matches found.</p>
          )}
          {matches && matches.docs.map(doc => {
            const match = doc.data();
            const matchId = doc.id;
            return (
              <Card key={matchId} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="md:col-span-1">
                    <h4 className="font-semibold">{match.matchTitle}</h4>
                    <p className="text-sm text-muted-foreground">ID: {matchId}</p>
                    <p className="text-sm">Entry: ₹{match.entry} | Players: {match.players.length}</p>
                    <Badge variant="outline">{match.status}</Badge>
                  </div>
                  <div className="md:col-span-2 flex flex-col sm:flex-row gap-2">
                     <Select 
                        onValueChange={(value) => setSelectedWinner(prev => ({...prev, [matchId]: value}))}
                        value={selectedWinner[matchId] || ''}
                     >
                        <SelectTrigger>
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
                      onClick={() => handleDeclareWinner(matchId)}
                      disabled={isSubmitting[matchId] || !selectedWinner[matchId]}
                      className='flex-shrink-0'
                    >
                      {isSubmitting[matchId] ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Crown className="mr-2 h-4 w-4"/>}
                      Declare Winner
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
