
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { httpsCallable } from 'firebase/functions';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Gamepad2, Users, Flame, ChevronRight, Wallet, AlertTriangle, Info, SlidersHorizontal, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useCollection, useDoc, useFirebase, useUser } from '@/firebase';
import { collection, doc, query, where, orderBy } from 'firebase/firestore';

export default function MatchmakingPage() {
  const router = useRouter();
  const { firestore, functions } = useFirebase();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isJoinConfirmOpen, setIsJoinConfirmOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({ feeRange: [10, 5000], playerCount: 'all' });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const walletDocRef = useMemo(() => firestore && user ? doc(firestore, 'wallets', user.uid) : null, [firestore, user]);
  const { data: wallet, isLoading: isWalletLoading } = useDoc(walletDocRef);
  const totalBalance = useMemo(() => {
    if (!wallet) return 0;
    return (wallet.depositBalance || 0) + (wallet.winningBalance || 0) + (wallet.bonusBalance || 0);
  }, [wallet]);

  const handleFilterChange = (key: string, value: any) => setFilters(prev => ({ ...prev, [key]: value }));

  const matchesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'matches'), 
        where('status', 'in', ['waiting', 'inprogress']),
        orderBy('createdAt', 'desc')
    );
  }, [firestore]);
  const { data: allMatches, isLoading: isLoadingMatches } = useCollection(matchesQuery);

  const { myMatches, openMatches, inProgressMatches } = useMemo(() => {
    if (!allMatches || !user) return { myMatches: [], openMatches: [], inProgressMatches: [] };

    const filtered = allMatches.filter(match => {
        const searchInput = searchQuery.toLowerCase();
        const isSearchMatch = match.id.toLowerCase().includes(searchInput) || 
                              match.creatorName?.toLowerCase().includes(searchInput);
        
        const isInFeeRange = match.entry >= filters.feeRange[0] && match.entry <= filters.feeRange[1];
        const isPlayerCountMatch = filters.playerCount === 'all' || match.maxPlayers.toString() === filters.playerCount;
        
        return isSearchMatch && isInFeeRange && isPlayerCountMatch;
    });

    const myMatches = filtered.filter(m => m.players.includes(user.uid));
    const openMatches = filtered.filter(m => m.status === 'waiting' && !m.players.includes(user.uid));
    const inProgressMatches = filtered.filter(m => m.status === 'inprogress' && !m.players.includes(user.uid));
    
    return { myMatches, openMatches, inProgressMatches };

  }, [allMatches, searchQuery, filters, user]);

  const handleCreateMatch = () => router.push('/play');
  const handleViewLobby = (matchId: string) => router.push(`/match/${matchId}`);
  
  const handleJoinClick = (match: any) => {
      if (totalBalance < match.entry) {
          toast.error("Insufficient Balance", { description: "You don't have enough funds to join this match." });
          return;
      }
      setSelectedMatch(match);
      setIsJoinConfirmOpen(true);
  };

  const handleConfirmJoin = async () => {
      if (!selectedMatch || !functions) return;
      
      setIsSubmitting(true);
      const joinMatchFn = httpsCallable(functions, 'joinMatch');

      try {
          const result = await joinMatchFn({ matchId: selectedMatch.id });
          // @ts-ignore
          if (result.data.status === 'success') {
              // @ts-ignore
              toast.success("Successfully Joined!", { description: result.data.message });
              router.push(`/match/${selectedMatch.id}`);
          } else {
              throw new Error('Failed to join match');
          }
      } catch (error: any) {
          console.error("Join match error:", error);
          toast.error("Join Failed", { description: error.message || "Could not join the match. Please try again." });
      } finally {
          setIsSubmitting(false);
          setIsJoinConfirmOpen(false);
      }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config: {[key: string]: string} = {
      'waiting': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      'inprogress': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    };
    return <Badge variant="outline" className={`font-semibold text-xs ${config[status]}`}>{status}</Badge>;
  }

  const MatchCard = ({ match, action }: { match: any, action: React.ReactNode }) => (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <p className="text-sm font-semibold text-muted-foreground">#{match.id}</p>
                    <CardTitle className="text-lg font-bold leading-tight mt-1">{match.creatorName}</CardTitle>
                </div>
                <Badge variant="secondary" className="text-base font-bold shrink-0 px-4 py-2">₹{match.entry}</Badge>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground mt-4">
                <span className="flex items-center"><Users className="mr-1.5 h-4 w-4" />{match.players.length} / {match.maxPlayers}</span>
                <StatusBadge status={match.status} />
            </div>
            <div className="mt-4">{action}</div>
        </CardContent>
    </Card>
  );
  
  const renderMatchList = (matches: any[], type: 'my' | 'open' | 'inprogress') => {
    if (isLoadingMatches) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 w-full" />)}
            </div>
        )
    }
    if (matches.length === 0) {
        return <p className="text-muted-foreground text-center py-10 col-span-full">No matches found.</p>;
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {matches.map(m => {
                let action;
                if (type === 'my') {
                    action = <Button size="sm" className="w-full font-semibold" onClick={() => handleViewLobby(m.id)}>View Lobby</Button>;
                } else if (type === 'open') {
                    action = <Button size="sm" className="w-full font-semibold bg-green-600 hover:bg-green-700" onClick={() => handleJoinClick(m)}>Join Match</Button>;
                } else {
                    action = <Button size="sm" variant="outline" disabled className="w-full font-semibold">In Progress</Button>;
                }
                return <MatchCard key={m.id} match={m} action={action} />
            })}
        </div>
    );
  };

  const FiltersContent = () => (
    <div className="p-4 space-y-6">
        <div className="space-y-3">
            <Label className="font-semibold">Entry Fee: ₹{filters.feeRange[0]} - ₹{filters.feeRange[1]}</Label>
            <Slider value={filters.feeRange} onValueChange={(val) => handleFilterChange('feeRange', val)} min={10} max={5000} step={10} />
        </div>
        <div className="space-y-2">
            <Label className="font-semibold">Player Count</Label>
            <Select value={filters.playerCount} onValueChange={(val) => handleFilterChange('playerCount', val)}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="2">2 Players</SelectItem>
                    <SelectItem value="4">4 Players</SelectItem>
                </SelectContent>
            </Select>
        </div>
    </div>
  );

  if (isUserLoading || !user) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto max-w-5xl py-4 sm:py-6 px-2 sm:px-4">
        <header className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center"><Gamepad2 className="mr-2 h-7 w-7 text-primary" /> Matchmaking</h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">Find and join Ludo matches.</p>
            </div>
            <Button size="lg" className="text-base hidden sm:flex" onClick={handleCreateMatch}><Star className="mr-2 h-5 w-5"/> Create Match</Button>
        </header>

        <Tabs defaultValue="open" className="w-full">
            <div className="flex flex-col sm:flex-row gap-4">
                <TabsList className="grid grid-cols-3 sm:grid-cols-none sm:inline-flex h-auto">
                    <TabsTrigger value="open" className="py-2.5 px-4"><Flame className="mr-2 h-4 w-4"/>Open</TabsTrigger>
                    <TabsTrigger value="my-matches" className="py-2.5 px-4">My Matches</TabsTrigger>
                    <TabsTrigger value="inprogress" className="py-2.5 px-4">In Progress</TabsTrigger>
                </TabsList>
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search by Room Code or Creator..." className="pl-10 h-11 w-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <SheetTrigger asChild>
                     <Button variant="outline" className="h-11"><SlidersHorizontal className="mr-2 h-4 w-4"/> Filters</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filter Matches</SheetTitle>
                    </SheetHeader>
                    <FiltersContent />
                    <SheetFooter className="mt-6">
                      <Button variant="ghost" onClick={() => {setFilters({ feeRange: [10, 5000], playerCount: 'all' });}}>Reset</Button>
                      <SheetClose asChild><Button>Apply Filters</Button></SheetClose>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
            </div>

            <TabsContent value="open">{renderMatchList(openMatches, 'open')}</TabsContent>
            <TabsContent value="my-matches">{renderMatchList(myMatches, 'my')}</TabsContent>
            <TabsContent value="inprogress">{renderMatchList(inProgressMatches, 'inprogress')}</TabsContent>
        </Tabs>

        <div className="fixed bottom-20 right-4 sm:hidden">
            <Button size="lg" className="rounded-full h-16 w-16 shadow-lg" onClick={handleCreateMatch}><Star className="h-7 w-7"/></Button>
        </div>
        
        <AlertDialog open={isJoinConfirmOpen} onOpenChange={setIsJoinConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm to Join Match</AlertDialogTitle>
              <AlertDialogDescription>You are about to join <span className="font-bold">{selectedMatch?.creatorName}'s</span> match for <span className="font-bold">₹{selectedMatch?.entry}</span>.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground flex items-center"><Wallet className="mr-2 h-4 w-4"/> Your Current Balance</span>
                <span className={`font-semibold ${isWalletLoading ? 'animate-pulse' : ''}`}>₹{totalBalance.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-500/10 border-l-4 border-red-500 rounded-lg">
                <span className="font-semibold flex items-center text-red-800 dark:text-red-200"><AlertTriangle className="mr-2 h-4 w-4"/> Balance After Joining</span>
                <span className="font-bold text-red-800 dark:text-red-200">₹{(totalBalance - (selectedMatch?.entry || 0)).toFixed(2)}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 p-3 rounded-lg space-y-1">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center"><Info className="mr-2 h-4 w-4"/>Please Note:</h4>
                <ul className="list-disc list-inside pl-1">
                    <li>The entry fee will be deducted from your wallet immediately upon joining.</li>
                    <li>Ensure you are ready to play. Leaving the match after joining may result in a penalty.</li>
                </ul>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmJoin} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm and Join
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
