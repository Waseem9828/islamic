
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Gamepad2, Users, Clock, Flame, ChevronRight, Wallet, AlertTriangle, Info, Dot, XCircle, SlidersHorizontal, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCollection, useDoc, useFirebase, useUser } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';

export default function MatchmakingHomePage() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { user } = useUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [isJoinConfirmOpen, setIsJoinConfirmOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [filters, setFilters] = useState({ feeRange: [10, 1000], playerCount: 'all', status: 'all' });

  const walletDocRef = useMemo(() => firestore && user ? doc(firestore, 'wallets', user.uid) : null, [firestore, user]);
  const { data: wallet, isLoading: isWalletLoading } = useDoc(walletDocRef);
  const walletBalance = wallet?.balance ?? 0;

  const handleFilterChange = (key: string, value: any) => setFilters(prev => ({ ...prev, [key]: value }));

  const matchesQuery = useMemo(() => firestore ? query(collection(firestore, 'matches')) : null, [firestore]);
  const { data: allMatches, isLoading: isLoadingMatches } = useCollection(matchesQuery);

  const filteredMatches = useMemo(() => {
    if (!allMatches) return { openMatches: [], myActiveMatches: [], ongoingMatches: [], cancelledMatches: [] };

    const filtered = allMatches.filter(match => {
        const isSearchMatch = match.room.toLowerCase().includes(searchQuery.toLowerCase()) || match.creatorName?.toLowerCase().includes(searchQuery.toLowerCase());
        const isInFeeRange = match.entry >= filters.feeRange[0] && match.entry <= filters.feeRange[1];
        const isPlayerCountMatch = filters.playerCount === 'all' || match.players?.length.toString() === filters.playerCount;
        return isSearchMatch && isInFeeRange && isPlayerCountMatch;
    });

    const openMatches = filtered.filter((m: any) => m.status === 'Waiting for Players' && !(user && m.players.includes(user.uid)));
    const myActiveMatches = user ? filtered.filter((m: any) => (m.status === 'Waiting for Players' || m.status === 'Ready to Start') && m.players.includes(user.uid)) : [];
    const ongoingMatches = filtered.filter((m: any) => m.status === 'In Progress');
    const cancelledMatches = filtered.filter((m: any) => m.status === 'Cancelled');
    
    return { openMatches, myActiveMatches, ongoingMatches, cancelledMatches };

  }, [allMatches, searchQuery, filters, user]);

  const { openMatches, myActiveMatches, ongoingMatches, cancelledMatches } = filteredMatches;

  const handleCreateMatch = () => router.push('/play');
  const handleViewLobby = (matchId: string) => router.push(`/match/${matchId}`);
  const handleSubmitResult = (matchId: string) => router.push(`/result/${matchId}`);
  const handleJoinClick = (match: any) => { if (walletBalance < match.entry) { toast.error("Insufficient Balance"); return; } setSelectedMatch(match); setIsJoinConfirmOpen(true); };
  const handleConfirmJoin = () => { if (selectedMatch) { handleViewLobby(selectedMatch.id) } setIsJoinConfirmOpen(false); };
  
  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      'Waiting for Players': { class: 'text-yellow-600 border-yellow-500/50 bg-yellow-500/10', icon: <span className="relative flex h-2 w-2 mr-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span></span> },
      'Ready to Start': { class: 'text-blue-600 border-blue-500/50 bg-blue-500/10', icon: <Dot className="mr-1 h-4 w-4 text-blue-500"/> },
      'In Progress': { class: 'text-orange-600 border-orange-500/50 bg-orange-500/10', icon: <span className="relative flex h-2 w-2 mr-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span></span> },
      'Cancelled': { class: 'text-red-600 border-red-500/50 bg-red-500/10', icon: <XCircle className="mr-1 h-3 w-3" /> },
    }[status] || { class: '' };
    return <Badge variant="outline" className={`font-semibold text-xs px-2 py-0.5 ${config.class}`}>{config.icon}{status}</Badge>;
  }

  const MatchCard = ({ match, button, borderColor, cardClassName }: any) => (
    <Card className={`overflow-hidden p-2 space-y-2.5 ${borderColor} ${cardClassName}`}>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-base font-bold">{match.room}</CardTitle>
                <CardDescription className="text-xs">By: {match.creatorName}</CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">₹{match.entry}</Badge>
        </div>
        <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="flex items-center"><Users className="mr-1 h-3 w-3" />{match.players.length}/{match.maxPlayers}</span>
            <span className="flex items-center"><Clock className="mr-1 h-3 w-3" />{match.timeLimit}</span>
        </div>
        <div className="flex justify-between items-center">
          <StatusBadge status={match.status} />
        </div>
        <div className="pt-1">{button}</div>
    </Card>
  );
  
  const renderMatchList = (matches: any[], type: 'my' | 'open' | 'ongoing' | 'cancelled') => {
    if (isLoadingMatches) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[1,2,3].map(i => <Card key={i} className="p-4 space-y-3"><div className="flex justify-between"><Loader2 className='w-4 h-4 animate-spin' /> <Loader2 className='w-4 h-4 animate-spin' /></div><Loader2 className='w-full h-4 animate-spin' /><Loader2 className='w-full h-8 animate-spin' /></Card>)}
            </div>
        )
    }
    if (matches.length === 0) {
        return <p className="text-muted-foreground text-center col-span-full py-4">No {type === 'open' ? 'open' : ''} matches found.</p>;
    }
    
    let button;
    let borderColor;

    switch (type) {
        case 'my':
            button = (match: any) => <Button size="sm" className="w-full text-xs h-8" onClick={() => handleViewLobby(match.id)}>View Lobby</Button>;
            borderColor = "border-blue-500/30 border-2";
            break;
        case 'open':
            button = (match: any) => <Button size="sm" className="w-full text-xs h-8 bg-green-600 hover:bg-green-700" onClick={() => handleJoinClick(match)}>Join Now</Button>;
            borderColor = "border-green-500/30 border-2";
            break;
        case 'ongoing':
            button = (match: any) => <Button size="sm" variant="outline" className="w-full text-xs h-8" onClick={() => handleSubmitResult(match.id)}>Submit Result</Button>;
            borderColor = "border-orange-500/30 border-2";
            break;
        case 'cancelled':
             button = () => <Button size="sm" variant="ghost" disabled className="w-full text-xs h-8">Cancelled</Button>;
             borderColor = "border-red-500/30 border-2";
             break;
    }
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {matches.map(m => <MatchCard key={m.id} match={m} borderColor={borderColor} button={button(m)} cardClassName={type === 'cancelled' ? 'opacity-75' : ''}/>)}
        </div>
    );
  };

  return (
    <div className="container mx-auto max-w-4xl py-4">
        <header className="text-center mb-6"><h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center justify-center"><Gamepad2 className="mr-2 h-8 w-8" /> Ludo Match Making</h1><p className="text-muted-foreground mt-2">Find, join, or create Ludo matches.</p></header>

        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search by Room Code or Creator..." className="pl-10 w-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline"><SlidersHorizontal className="mr-2 h-4 w-4"/> Filters</Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="absolute z-10 top-full right-0 mt-2 w-full max-w-xs bg-card border shadow-lg rounded-lg p-4 space-y-4">
                <div className="space-y-2">
                    <Label>Entry Fee: ₹{filters.feeRange[0]} - ₹{filters.feeRange[1]}</Label>
                    <Slider value={filters.feeRange} onValueChange={(val) => handleFilterChange('feeRange', val)} min={10} max={1000} step={10} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Player Count</Label>
                        <Select value={filters.playerCount} onValueChange={(val) => handleFilterChange('playerCount', val)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setFilters({ feeRange: [10, 1000], playerCount: 'all', status: 'all' })}>Reset</Button>
            </CollapsibleContent>
          </Collapsible>
        </div>


        <Accordion type="multiple" defaultValue={['my-active-matches', 'open-matches', 'ongoing-matches']} className="w-full space-y-4">
            <AccordionItem value="my-active-matches" className="border-none"><AccordionTrigger className="text-lg font-semibold text-blue-600 hover:no-underline rounded-lg bg-blue-500/10 px-4"><div className='flex items-center'>My Active<Badge variant="secondary" className="ml-2">{myActiveMatches.length}</Badge></div></AccordionTrigger><AccordionContent className="pt-2">{renderMatchList(myActiveMatches, 'my')}</AccordionContent></AccordionItem>
            <AccordionItem value="open-matches" className="border-none"><AccordionTrigger className="text-lg font-semibold text-green-600 hover:no-underline rounded-lg bg-green-500/10 px-4"><div className='flex items-center'><Flame className="mr-2 h-5 w-5" /> Open<Badge variant="secondary" className="ml-2">{openMatches.length}</Badge></div></AccordionTrigger><AccordionContent className="pt-2">{renderMatchList(openMatches, 'open')}</AccordionContent></AccordionItem>
            <AccordionItem value="ongoing-matches" className="border-none"><AccordionTrigger className="text-lg font-semibold text-orange-600 hover:no-underline rounded-lg bg-orange-500/10 px-4"><div className='flex items-center'>Ongoing<Badge variant="secondary" className="ml-2">{ongoingMatches.length}</Badge></div></AccordionTrigger><AccordionContent className="pt-2">{renderMatchList(ongoingMatches, 'ongoing')}</AccordionContent></AccordionItem>
            <AccordionItem value="cancelled-matches" className="border-none"><AccordionTrigger className="text-lg font-semibold text-red-600 hover:no-underline rounded-lg bg-red-500/10 px-4"><div className='flex items-center'><XCircle className="mr-2 h-5 w-5"/>Cancelled<Badge variant="secondary" className="ml-2">{cancelledMatches.length}</Badge></div></AccordionTrigger><AccordionContent className="pt-2">{renderMatchList(cancelledMatches, 'cancelled')}</AccordionContent></AccordionItem>
        </Accordion>

        <div className="mt-8"><Button size="lg" className="w-full text-lg py-6" onClick={handleCreateMatch}>Create New Match <ChevronRight className="ml-2 h-5 w-5" /></Button></div>
        <AlertDialog open={isJoinConfirmOpen} onOpenChange={setIsJoinConfirmOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Join Match Confirmation</AlertDialogTitle><AlertDialogDescription>You are about to join <span className="font-bold">{selectedMatch?.room}</span>.</AlertDialogDescription></AlertDialogHeader><div className="space-y-4 py-4"><div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><span className="text-muted-foreground">Entry Fee</span><span className="font-bold text-lg">₹{selectedMatch?.entry}</span></div><div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><span className="text-muted-foreground flex items-center"><Wallet className="mr-2 h-4 w-4"/> Your Wallet</span><span className="font-semibold">₹{walletBalance}</span></div><div className="flex items-center justify-between p-3 bg-destructive/10 text-destructive-foreground border-l-4 border-destructive rounded-lg"><span className="text-sm font-semibold flex items-center"><AlertTriangle className="mr-2 h-4 w-4"/> After Join</span><span className="font-bold">₹{walletBalance - (selectedMatch?.entry || 0)}</span></div></div><div className="text-xs text-muted-foreground bg-gray-100 p-3 rounded-lg space-y-1"><h4 className="font-semibold text-gray-800 flex items-center"><Info className="mr-2 h-4 w-4"/>Terms:</h4><ul className="list-disc list-inside"><li>Entry fee will be deducted immediately.</li><li>A full refund is issued if the match is canceled.</li><li>Adhere to fair play rules.</li></ul></div><AlertDialogFooter><AlertDialogCancel>Back</AlertDialogCancel><AlertDialogAction onClick={handleConfirmJoin} className="bg-green-600 hover:bg-green-700">Confirm & Join</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

    