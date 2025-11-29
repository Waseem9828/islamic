
'use client';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Loader2, IndianRupee, Trophy, PlusCircle } from 'lucide-react';
import { useCollection, useUser, useFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

const MatchCard = ({ match }: { match: any }) => {
    const router = useRouter();
    const prizePool = match.entryFee * match.maxPlayers * 0.9; // Assuming 10% commission

    const getPlayerAvatars = () => {
        const playerIds = match.players;
        if (!playerIds || playerIds.length === 0) {
            return <div className="flex -space-x-4"><Avatar><AvatarFallback>?</AvatarFallback></Avatar></div>;
        }

        const avatars = playerIds.slice(0, 2).map((pid: string) => {
            const playerInfo = match.playerInfo[pid];
            return (
                <Avatar key={pid} className="border-2 border-background">
                    <AvatarImage src={playerInfo?.photoURL} />
                    <AvatarFallback>{playerInfo?.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
            );
        });

        if (playerIds.length < 2) {
             avatars.push(
                <Avatar key="placeholder" className="border-2 border-background bg-muted">
                    <AvatarFallback>?</AvatarFallback>
                </Avatar>
            );
        }

        return <div className="flex -space-x-4 rtl:space-x-reverse">{avatars}</div>;
    };

    return (
        <Card 
            className="overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up cursor-pointer"
            onClick={() => router.push(`/match/${match.id}`)}
        >
            <CardContent className="p-3 flex items-center gap-4">
                {getPlayerAvatars()}
                <div className="flex-1">
                    <p className="font-semibold truncate">{match.creatorName}'s Game</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><IndianRupee className="h-4 w-4 text-amber-500"/>{match.entryFee}</span>
                        <span className="flex items-center gap-1"><Trophy className="h-4 w-4 text-yellow-500"/>{prizePool.toFixed(0)}</span>
                    </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
        </Card>
    );
};

export default function PlayPage() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const matchesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'matches'), 
        where('status', 'in', ['waiting', 'inprogress']),
        orderBy('createdAt', 'desc')
    );
  }, [firestore]);
  
  const { data: allMatches, isLoading: isLoadingMatches } = useCollection(matchesQuery);

  const { myMatches, openMatches } = useMemo(() => {
    if (!allMatches || !user) return { myMatches: [], openMatches: [] };

    const my = allMatches.filter(m => m.players.includes(user.uid));
    const open = allMatches.filter(m => m.status === 'waiting' && !m.players.includes(user.uid));
    
    return { myMatches: my, openMatches: open };

  }, [allMatches, user]);

  const renderMatchList = (matches: any[], title: string) => {
    return (
        <section className="mb-6">
             <h2 className="text-lg font-semibold">{title}</h2>
             {isLoadingMatches ? (
                <div className="space-y-3 pt-2">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-[76px] w-full" />)}
                </div>
            ) : matches.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">No matches found.</p>
            ) : (
                <div className="space-y-3 pt-2">
                    {matches.map((m) => (
                        <MatchCard key={m.id} match={m} />
                    ))}
                </div>
            )}
        </section>
    );
  };

  if (isUserLoading || !user) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 animate-fade-in-up">
        <Button size="lg" className="w-full mb-6" onClick={() => router.push('/play/new')}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Match
        </Button>

        {renderMatchList(myMatches, "Your Active Matches")}
        {renderMatchList(openMatches, "Open Public Matches")}
    </div>
  );
}
