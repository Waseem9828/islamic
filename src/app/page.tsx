
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Search, Gamepad2, Users, Clock, Flame, ChevronRight, Wallet, AlertTriangle, Info, Dot, XCircle, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';

// Enhanced mock data
const allMatches = [
  { id: 1, room: 'LUDO123', entry: 50, players: '1/4', createdBy: 'PlayerX', createdAt: '2m ago', status: 'Waiting for Players', playersList: ['PlayerX'] },
  { id: 2, room: 'GAME456', entry: 100, players: '2/4', createdBy: 'ProPlayer', createdAt: '5m ago', status: 'Waiting for Players', playersList: ['ProPlayer', 'PlayerY'] },
  { id: 3, room: 'MYROOM1', entry: 50, players: '4/4', waiting: '8m ago', status: 'Ready to Start', playersList: ['You', 'PlayerA', 'PlayerB', 'PlayerC'], type: 'my-active' },
  { id: 4, room: 'JOINED12', entry: 100, players: '2/4', waiting: '3m ago', status: 'Waiting for Players', playersList: ['You', 'PlayerC'], type: 'my-active' },
  { id: 5, room: 'PLAY789', entry: 200, players: '4/4', started: '12m ago', status: 'In Progress', playersList: ['You', 'PlayerA', 'PlayerB', 'PlayerC'], type: 'ongoing' },
  { id: 7, room: 'CANCEL1', entry: 100, status: 'Cancelled', reason: 'Not enough players', type: 'cancelled' },
  { id: 8, room: 'BATTLE55', entry: 500, status: 'Cancelled', reason: 'Creator inactive', type: 'cancelled' },
  { id: 9, room: 'FASTMATCH', entry: 20, players: '3/4', createdBy: 'Speedy', createdAt: '1h ago', status: 'Waiting for Players', playersList: ['Speedy', 'PlayerZ', 'PlayerW'] },
  { id: 10, room: 'HIGHROLLER', entry: 1000, players: '1/4', createdBy: 'RichBoi', createdAt: '2h ago', status: 'Waiting for Players', playersList: ['RichBoi'] },
];

export default function MatchmakingHomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isJoinConfirmOpen, setIsJoinConfirmOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [walletBalance, setWalletBalance] = useState(2450);
  const [filters, setFilters] = useState({ feeRange: [10, 1000], playerCount: 'all', status: 'all' });

  const handleFilterChange = (key: string, value: any) => setFilters(prev => ({ ...prev, [key]: value }));

  const filteredOpenMatches = useMemo(() => allMatches.filter(match => {
      const isSearchMatch = match.room.toLowerCase().includes(searchQuery.toLowerCase()) || match.createdBy?.toLowerCase().includes(searchQuery.toLowerCase());
      const isInFeeRange = match.entry >= filters.feeRange[0] && match.entry <= filters.feeRange[1];
      const isPlayerCountMatch = filters.playerCount === 'all' || match.players?.endsWith(`/${filters.playerCount}`);
      return !match.type && isSearchMatch && isInFeeRange && isPlayerCountMatch;
    }), [searchQuery, filters]);

  const myActiveMatches = allMatches.filter(m => m.type === 'my-active');
  const ongoingMatches = allMatches.filter(m => m.type === 'ongoing');
  const cancelledMatches = allMatches.filter(m => m.type === 'cancelled');

  const handleCreateMatch = () => router.push('/play');
  const handleViewLobby = (matchId: string) => router.push(`/match/${matchId}`);
  const handleSubmitResult = (matchId: string) => router.push(`/result/${matchId}`);
  const handleJoinClick = (match: any) => { if (walletBalance < match.entry) { toast.error("Insufficient Balance"); return; } setSelectedMatch(match); setIsJoinConfirmOpen(true); };
  const handleConfirmJoin = () => { toast.success('Successfully joined match!'); setIsJoinConfirmOpen(false); };
  
  const StatusBadge = ({ status }: { status: string }) => {
    const config = {
      'Waiting for Players': { class: 'text-yellow-600 border-yellow-500/50 bg-yellow-500/10', icon: <span className="relative flex h-2 w-2 mr-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span></span> },
      'Ready to Start': { class: 'text-blue-600 border-blue-500/50 bg-blue-500/10', icon: <Dot className="mr-1 h-4 w-4 text-blue-500"/> },
      'In Progress': { class: 'text-orange-600 border-orange-500/50 bg-orange-500/10', icon: <span className="relative flex h-2 w-2 mr-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span></span> },
      'Cancelled': { class: 'text-red-600 border-red-500/50 bg-red-500/10', icon: <XCircle className="mr-1 h-3 w-3" /> },
    }[status] || { class: '' };
    return <Badge variant="outline" className={`font-semibold text-xs px-2 py-1 ${config.class}`}>{config.icon}{status}</Badge>;
  }

  const MatchCard = ({ match, button, borderColor, cardClassName }: any) => (
    <Card className={`overflow-hidden ${borderColor} ${cardClassName}`}>
        <div className="p-3 space-y-1">
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-md font-bold">{match.room}</CardTitle>
                    {match.createdBy && <CardDescription className="text-xs">By: {match.createdBy}</CardDescription>}
                </div>
                <Badge variant="secondary" className="text-sm">₹{match.entry}</Badge>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span className="flex items-center"><Users className="mr-1 h-3 w-3" />{match.players}</span>
                <span className="flex items-center"><Clock className="mr-1 h-3 w-3" />{match.createdAt || match.waiting || match.started}</span>
            </div>
             <StatusBadge status={match.status} />
            <div className="pt-1">{button}</div>
        </div>
    </Card>
  );

  return (
    <div className="container mx-auto max-w-4xl py-4">
        <header className="text-center mb-6"><h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center justify-center"><Gamepad2 className="mr-2 h-8 w-8" /> Ludo Match Making</h1><p className="text-muted-foreground mt-2">Find, join, or create Ludo matches.</p></header>

        <Collapsible className="mb-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Search by Room Code or Creator..." className="pl-10 w-full" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="outline"><SlidersHorizontal className="mr-2 h-4 w-4"/> Filters</Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="pt-4 space-y-4">
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
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="4">4</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setFilters({ feeRange: [10, 1000], playerCount: 'all', status: 'all' })}>Reset</Button>
          </CollapsibleContent>
        </Collapsible>


        <Accordion type="multiple" defaultValue={['my-active-matches', 'open-matches', 'ongoing-matches']} className="w-full space-y-4">
            <AccordionItem value="my-active-matches" className="border-none"><AccordionTrigger className="text-lg font-semibold text-blue-600 hover:no-underline rounded-lg bg-blue-500/10 px-4"><div className='flex items-center'>My Active<Badge variant="secondary" className="ml-2">{myActiveMatches.length}</Badge></div></AccordionTrigger><AccordionContent className="pt-2"><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">{myActiveMatches.map(m => <MatchCard key={m.id} match={m} borderColor="border-blue-500/30 border-2" button={<Button size="sm" className="w-full text-xs h-8" onClick={() => handleViewLobby(m.room)}>View Lobby</Button>} />)}</div></AccordionContent></AccordionItem>
            <AccordionItem value="open-matches" className="border-none"><AccordionTrigger className="text-lg font-semibold text-green-600 hover:no-underline rounded-lg bg-green-500/10 px-4"><div className='flex items-center'><Flame className="mr-2 h-5 w-5" /> Open<Badge variant="secondary" className="ml-2">{filteredOpenMatches.length}</Badge></div></AccordionTrigger><AccordionContent className="pt-2"><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">{filteredOpenMatches.map(m => <MatchCard key={m.id} match={m} borderColor="border-green-500/30 border-2" button={<Button size="sm" className="w-full text-xs h-8 bg-green-600 hover:bg-green-700" onClick={() => handleJoinClick(m)}>Join Now</Button>} />)}{filteredOpenMatches.length === 0 && <p className="text-muted-foreground text-center col-span-full py-4">No matches found.</p>}</div></AccordionContent></AccordionItem>
            <AccordionItem value="ongoing-matches" className="border-none"><AccordionTrigger className="text-lg font-semibold text-orange-600 hover:no-underline rounded-lg bg-orange-500/10 px-4"><div className='flex items-center'>Ongoing<Badge variant="secondary" className="ml-2">{ongoingMatches.length}</Badge></div></AccordionTrigger><AccordionContent className="pt-2"><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">{ongoingMatches.map(m => <MatchCard key={m.id} match={m} borderColor="border-orange-500/30 border-2" button={<Button size="sm" variant="outline" className="w-full text-xs h-8" onClick={() => handleSubmitResult(m.room)}>Submit Result</Button>} />)}</div></AccordionContent></AccordionItem>
            <AccordionItem value="cancelled-matches" className="border-none"><AccordionTrigger className="text-lg font-semibold text-red-600 hover:no-underline rounded-lg bg-red-500/10 px-4"><div className='flex items-center'><XCircle className="mr-2 h-5 w-5"/>Cancelled<Badge variant="secondary" className="ml-2">{cancelledMatches.length}</Badge></div></AccordionTrigger><AccordionContent className="pt-2"><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">{cancelledMatches.map(m => <MatchCard key={m.id} match={m} borderColor="border-red-500/30 border-2" cardClassName="opacity-75" button={<Button size="sm" variant="ghost" disabled className="w-full text-xs h-8">Cancelled</Button>} />)}</div></AccordionContent></AccordionItem>
        </Accordion>

        <div className="mt-8"><Button size="lg" className="w-full text-lg py-6" onClick={handleCreateMatch}>Create New Match <ChevronRight className="ml-2 h-5 w-5" /></Button></div>
        <AlertDialog open={isJoinConfirmOpen} onOpenChange={setIsJoinConfirmOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Join Match Confirmation</AlertDialogTitle><AlertDialogDescription>You are about to join <span className="font-bold">{selectedMatch?.room}</span>.</AlertDialogDescription></AlertDialogHeader><div className="space-y-4 py-4"><div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><span className="text-muted-foreground">Entry Fee</span><span className="font-bold text-lg">₹{selectedMatch?.entry}</span></div><div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"><span className="text-muted-foreground flex items-center"><Wallet className="mr-2 h-4 w-4"/> Your Wallet</span><span className="font-semibold">₹{walletBalance}</span></div><div className="flex items-center justify-between p-3 bg-destructive/10 text-destructive-foreground border-l-4 border-destructive rounded-lg"><span className="text-sm font-semibold flex items-center"><AlertTriangle className="mr-2 h-4 w-4"/> After Join</span><span className="font-bold">₹{walletBalance - (selectedMatch?.entry || 0)}</span></div></div><div className="text-xs text-muted-foreground bg-gray-100 p-3 rounded-lg space-y-1"><h4 className="font-semibold text-gray-800 flex items-center"><Info className="mr-2 h-4 w-4"/>Terms:</h4><ul className="list-disc list-inside"><li>Entry fee will be deducted immediately.</li><li>A full refund is issued if the match is canceled.</li><li>Adhere to fair play rules.</li></ul></div><AlertDialogFooter><AlertDialogCancel>Back</AlertDialogCancel><AlertDialogAction onClick={handleConfirmJoin} className="bg-green-600 hover:bg-green-700">Confirm & Join</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}
