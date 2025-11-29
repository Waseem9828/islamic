
'use client';

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronRight, IndianRupee, Trophy, PlusCircle, Gamepad2, Search, ListFilter, Flame, Hourglass, XCircle, User } from 'lucide-react';
import { useUser, useFirebase } from '@/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { LoadingScreen } from '@/components/ui/loading';
import { cn } from '@/lib/utils';


const MatchCard = ({ match }: { match: any }) => {
    const router = useRouter();
    const prizePool = match.entryFee * match.players.length * 0.9; 

    const getPlayerAvatars = () => {
        const playerIds = match.players;
        const playerInfos = match.playerInfo || {};

        if (!playerIds || playerIds.length === 0) {
            return <div className="flex -space-x-4"><Avatar><AvatarFallback>?</AvatarFallback></Avatar></div>;
        }

        const avatars = playerIds.slice(0, 2).map((pid: string) => {
            const playerInfo = playerInfos[pid];
            return (
                <Avatar key={pid} className="border-2 border-background h-10 w-10">
                    <AvatarImage src={playerInfo?.photoURL} />
                    <AvatarFallback>{playerInfo?.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
            );
        });

        if (playerIds.length < match.maxPlayers) {
            const placeholders = Array.from({ length: match.maxPlayers - playerIds.length });
            placeholders.slice(0, 2 - avatars.length).forEach((_, index) => {
                 avatars.push(
                    <Avatar key={`placeholder-${index}`} className="border-2 border-background bg-muted h-10 w-10">
                        <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                );
            })
        }

        return <div className="flex -space-x-4 rtl:space-x-reverse">{avatars}</div>;
    };

    return (
        <Card 
            className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/50 animate-fade-in-up cursor-pointer"
            onClick={() => router.push(`/match/${match.id}`)}
        >
            <CardContent className="p-3 flex items-center gap-4">
                {getPlayerAvatars()}
                <div className="flex-1">
                    <p className="font-semibold truncate text-sm">{match.creatorName}'s Game</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3 text-amber-500"/>{match.entryFee}</span>
                        <span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-yellow-500"/>{prizePool.toFixed(0)}</span>
                    </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
        </Card>
    );
};

const MatchListSection = ({ matches }: { matches: any[] }) => {
    if (matches.length === 0) {
        return <p className="text-muted-foreground text-center py-6 text-sm">No matches found.</p>;
    }
    return (
        <div className="space-y-3 pt-2">
            {matches.map((m) => (
                <MatchCard key={m.id} match={m} />
            ))}
        </div>
    );
}

export default function PlayPage() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (!firestore) return;

    const matchesQuery = query(
        collection(firestore, 'matches'), 
        orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(matchesQuery, (snapshot) => {
      const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllMatches(matches);
      setIsLoadingMatches(false);
    }, (error) => {
      console.error("Failed to fetch matches:", error);
      setIsLoadingMatches(false);
    });

    return () => unsubscribe();
  }, [firestore]);
  
  const { myMatches, openMatches, ongoingMatches, cancelledMatches } = useMemo(() => {
    if (!allMatches || !user) return { myMatches: [], openMatches: [], ongoingMatches: [], cancelledMatches: [] };

    const my = allMatches.filter(m => m.players.includes(user.uid) && (m.status === 'waiting' || m.status === 'inprogress'));
    const open = allMatches.filter(m => m.status === 'waiting' && !m.players.includes(user.uid) && m.privacy === 'public');
    const ongoing = allMatches.filter(m => m.status === 'inprogress');
    const cancelled = allMatches.filter(m => m.status === 'cancelled');
    
    return { myMatches: my, openMatches: open, ongoingMatches: ongoing, cancelledMatches: cancelled };

  }, [allMatches, user]);

  if (isUserLoading || isLoadingMatches || !user) {
    return <LoadingScreen />;
  }

  const triggerClasses = "flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold transition-all hover:no-underline text-foreground";

  return (
    <div className="p-4 animate-fade-in-up">
        <div className="text-center mb-6">
            <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
                <Gamepad2 className="h-8 w-8" /> Ludo Match Making
            </h1>
            <p className="text-muted-foreground mt-1">Find, join, or create Ludo matches.</p>
        </div>
        
        <div className="flex gap-2 mb-4">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by Room Code" className="pl-9" />
            </div>
            <Button variant="outline"><ListFilter className="mr-2 h-4 w-4"/>Filters</Button>
        </div>

        <Button size="lg" className="w-full mb-6" onClick={() => router.push('/play/new')}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Match
        </Button>
        
        <Accordion type="multiple" defaultValue={['item-1', 'item-2']} className="w-full space-y-3">
            <AccordionItem value="item-1" className="border-b-0">
                <AccordionTrigger className={cn(triggerClasses, "bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200/70")}>
                    <span className="flex items-center gap-2"><User className="h-4 w-4 text-blue-600 dark:text-blue-400"/> My Active</span>
                    <Badge variant="secondary">{myMatches.length}</Badge>
                </AccordionTrigger>
                <AccordionContent className="p-1">
                    <MatchListSection matches={myMatches} />
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-2" className="border-b-0">
                <AccordionTrigger className={cn(triggerClasses, "bg-green-100 dark:bg-green-900/30 hover:bg-green-200/70")}>
                    <span className="flex items-center gap-2"><Flame className="h-4 w-4 text-green-600 dark:text-green-400"/> Open</span>
                     <Badge variant="secondary">{openMatches.length}</Badge>
                </AccordionTrigger>
                <AccordionContent className="p-1">
                    <MatchListSection matches={openMatches} />
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-3" className="border-b-0">
                <AccordionTrigger className={cn(triggerClasses, "bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200/70")}>
                    <span className="flex items-center gap-2"><Hourglass className="h-4 w-4 text-orange-600 dark:text-orange-400"/> Ongoing</span>
                     <Badge variant="secondary">{ongoingMatches.length}</Badge>
                </AccordionTrigger>
                <AccordionContent className="p-1">
                     <MatchListSection matches={ongoingMatches} />
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-4" className="border-b-0">
                <AccordionTrigger className={cn(triggerClasses, "bg-red-100 dark:bg-red-900/30 hover:bg-red-200/70")}>
                    <span className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-600 dark:text-red-400"/> Cancelled</span>
                    <Badge variant="secondary">{cancelledMatches.length}</Badge>
                </AccordionTrigger>
                <AccordionContent className="p-1">
                    <MatchListSection matches={cancelledMatches} />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
  );
}

