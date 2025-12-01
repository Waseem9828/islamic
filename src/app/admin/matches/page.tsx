
'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase/provider';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, XCircle, Crown, Loader2, PlusCircle, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { getCoreRowModel, getSortedRowModel, getFilteredRowModel, useReactTable } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, onSnapshot, Timestamp, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Types
interface Match {
    id: string;
    matchTitle: string;
    status: 'waiting' | 'inprogress' | 'completed' | 'cancelled' | 'archived';
    entryFee: number;
    maxPlayers: number;
    players: string[];
    createdAt: Timestamp;
    winner?: string;
}

interface NewMatchState {
    title: string;
    entryFee: string;
    maxPlayers: string;
}

const MatchClient = () => {
    const { firestore, functions } = useFirebase();
    const router = useRouter();
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
    const [actionState, setActionState] = useState<{ matchId: string | null; winnerId: string | null; type: 'win' | 'cancel' | null }>({ matchId: null, winnerId: null, type: null });
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newMatch, setNewMatch] = useState<NewMatchState>({ title: '', entryFee: '', maxPlayers: '' });
    const [isCreatingMatch, setIsCreatingMatch] = useState(false);

    useEffect(() => {
        if (!firestore) return;
        setIsLoading(true);

        const matchesQuery = query(collection(firestore, 'matches'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(matchesQuery, (snapshot) => {
            const fetchedMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
            setMatches(fetchedMatches);
            setIsLoading(false);
        }, (err) => {
            console.error(err);
            toast.error("Failed to load matches", { description: err.message });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [firestore]);

    const handleCreateMatch = async () => {
        if (!firestore) return;
        const { title, entryFee, maxPlayers } = newMatch;
        if (!title || !entryFee || !maxPlayers) {
            toast.error("All fields are required.");
            return;
        }

        setIsCreatingMatch(true);
        try {
            // This is the line that was causing the error.
            // We ensure 'collection' and 'addDoc' are imported from 'firebase/firestore'
            await addDoc(collection(firestore, "matches"), {
                matchTitle: title,
                entryFee: parseInt(entryFee, 10),
                maxPlayers: parseInt(maxPlayers, 10),
                status: 'waiting',
                players: [],
                createdAt: Timestamp.now(),
            });
            toast.success("Match created successfully!");
            setIsCreateDialogOpen(false);
            setNewMatch({ title: '', entryFee: '', maxPlayers: '' });
        } catch (error: any) {
            console.error("Error creating match: ", error);
            toast.error("Error creating match:", { description: error.message });
        } finally {
            setIsCreatingMatch(false);
        }
    };
    
    const handleAction = async () => {
        if (!actionState.matchId || !actionState.type || !functions) return;
        
        setIsSubmittingAction(true);
        const { matchId, winnerId, type } = actionState;
        
        let actionFn;
        let payload: any = { matchId };
        let successMessage = '';
        
        if (type === 'win') {
            if (!winnerId) {
                toast.error("No winner selected.");
                setIsSubmittingAction(false);
                return;
            }
            actionFn = httpsCallable(functions, 'distributeWinnings');
            payload.winnerId = winnerId;
            successMessage = "Winner declared!";
        } else if (type === 'cancel') {
            actionFn = httpsCallable(functions, 'cancelMatchByAdmin');
            successMessage = "Match cancelled!";
        } else {
            setIsSubmittingAction(false);
            return;
        }

        try {
            await actionFn(payload);
            toast.success(successMessage);
        } catch (err: any) {
            toast.error("Action failed", { description: err.message });
        } finally {
            setActionState({ matchId: null, winnerId: null, type: null });
            setIsSubmittingAction(false);
        }
    };
    
    const columns: ColumnDef<Match>[] = useMemo(() => [
        {
            accessorKey: 'matchTitle',
            header: 'Match',
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.matchTitle}</div>
                    <div className="text-xs text-muted-foreground font-mono">{row.original.id}</div>
                </div>
            )
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const variantMap: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
                    waiting: 'secondary',
                    inprogress: 'default',
                    completed: 'default',
                    cancelled: 'destructive',
                    archived: 'outline',
                };
                const status = row.original.status;
                const badgeClass = status === 'inprogress' ? 'bg-blue-500/80 text-white' : '';
                return <Badge variant={variantMap[status] || 'secondary'} className={badgeClass}>{status}</Badge>;
            }
        },
        {
            accessorKey: 'entryFee',
            header: 'Entry Fee',
            cell: ({ row }) => `₹${row.original.entryFee}`
        },
        {
            accessorKey: 'players',
            header: 'Players',
            cell: ({ row }) => `${row.original.players.length} / ${row.original.maxPlayers}`
        },
        {
            accessorKey: 'createdAt',
            header: 'Created At',
            cell: ({ row }) => row.original.createdAt ? format(row.original.createdAt.toDate(), 'PPp') : 'N/A'
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const match = row.original;
                const isCancellable = match.status === 'waiting' || match.status === 'inprogress';
                const isDeclareWinnerEnabled = match.status === 'inprogress';

                return (
                    <AlertDialog onOpenChange={(open) => !open && setActionState({matchId: null, winnerId: null, type: null})}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => router.push(`/admin/matches/${match.id}`)}><Eye className="mr-2 h-4 w-4"/>View Details</DropdownMenuItem>
                                {isDeclareWinnerEnabled && (
                                    <AlertDialogTrigger asChild>
                                        <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-left" onClick={() => setActionState(prev => ({...prev, matchId: match.id}))}>
                                            <Crown className="mr-2 h-4 w-4"/>Declare Winner
                                        </button>
                                    </AlertDialogTrigger>
                                )}
                                {isCancellable && (
                                    <AlertDialogTrigger asChild>
                                         <button 
                                            onClick={() => setActionState({ matchId: match.id, winnerId: null, type: 'cancel' })}
                                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-left text-red-600 focus:text-red-600"
                                        >
                                            <XCircle className="mr-2 h-4 w-4"/>Cancel Match
                                        </button>
                                    </AlertDialogTrigger>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                             <AlertDialogHeader>
                                <AlertDialogTitle>
                                    {actionState.type === 'cancel' ? `Cancel Match ${actionState.matchId}?` : `Declare Winner for Match ${match.id}`}
                                </AlertDialogTitle>
                                {actionState.type === 'cancel' ? (
                                    <AlertDialogDescription>This will refund all players' entry fees and change the match status to 'cancelled'. This action is irreversible.</AlertDialogDescription>
                                ) : (
                                    <AlertDialogDescription>Select a winner from the list of players. This action is irreversible and will distribute the prize pool.</AlertDialogDescription>
                                )}
                            </AlertDialogHeader>
                            {actionState.type !== 'cancel' && (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {match.players.map(p => (
                                        <Button key={p} variant={actionState.winnerId === p ? 'default' : 'outline'} className='w-full justify-start' onClick={() => setActionState(prev => ({ ...prev, winnerId: p, type: 'win' }))}>
                                            <Crown className="mr-2 h-4 w-4"/> Declare <span className="font-mono mx-2 p-1 bg-muted rounded text-xs">{p}</span> as Winner
                                        </Button>
                                    ))}
                                </div>
                            )}
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isSubmittingAction}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    disabled={isSubmittingAction || (actionState.type === 'win' && !actionState.winnerId)}
                                    onClick={handleAction}
                                    className={actionState.type === 'cancel' ? 'bg-destructive hover:bg-destructive/90' : ''}
                                >
                                    {isSubmittingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirm
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                );
            }
        }
    ], [functions, actionState, isSubmittingAction, router]);

    const table = useReactTable({
        data: matches,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            globalFilter,
        },
    });

    if (isLoading) {
        return <MatchClientFallback />;
    }

    return (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Trophy className="mr-2"/> 
                    Match Command Center
                </CardTitle>
                <CardDescription>
                    A real-time interface for viewing, managing, and resolving all game matches.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center justify-between py-4">
                    <Input
                        placeholder="Search by title or ID..."
                        value={globalFilter ?? ''}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="max-w-sm"
                    />
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><PlusCircle className="mr-2 h-4 w-4"/> Create Match</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Match</DialogTitle>
                                <DialogDescription>Fill in the details below to create a new match.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="title" className="text-right">Title</Label>
                                    <Input id="title" value={newMatch.title} onChange={(e) => setNewMatch(prev => ({...prev, title: e.target.value}))} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="entry-fee" className="text-right">Entry Fee</Label>
                                    <Input id="entry-fee" type="number" value={newMatch.entryFee} onChange={(e) => setNewMatch(prev => ({...prev, entryFee: e.target.value}))} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="max-players" className="text-right">Max Players</Label>
                                    <Input id="max-players" type="number" value={newMatch.maxPlayers} onChange={(e) => setNewMatch(prev => ({...prev, maxPlayers: e.target.value}))} className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button variant={'outline'} disabled={isCreatingMatch}>Cancel</Button></DialogClose>
                                <Button onClick={handleCreateMatch} disabled={isCreatingMatch}>
                                    {isCreatingMatch && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Create
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                <DataTable table={table} columns={columns} />
            </CardContent>
        </Card>
    );
};

const MatchClientFallback = () => {
    return (
        <div className="space-y-4">
            <div className="flex items-center py-4">
                <Skeleton className="h-10 max-w-sm w-full" />
            </div>
            <div className="rounded-md border">
                 <div className="space-y-2 p-4">
                    {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            </div>
        </div>
    )
}

export default function ManageMatchesPage() {
    return (
        <Suspense fallback={<MatchClientFallback />}>
            <MatchClient />
        </Suspense>
    );
}
