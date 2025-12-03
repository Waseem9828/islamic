
'use client';

import { useState, useMemo, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase/provider';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, XCircle, Crown, Loader2, PlusCircle } from 'lucide-react';
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
import { Trophy } from 'lucide-react';

// Types
interface Game {
    id: string;
    gameTitle: string;
    status: 'waiting' | 'inprogress' | 'completed' | 'cancelled' | 'archived';
    entryFee: number;
    maxPlayers: number;
    players: string[];
    createdAt: Timestamp; // Timestamp
    winner?: string;
}

interface NewGameState {
    title: string;
    entryFee: string;
    maxPlayers: string;
}

// --- Client Component ---
export const GameClient = () => {
    const { firestore, functions } = useFirebase();
    const router = useRouter();
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
    const [actionState, setActionState] = useState<{ gameId: string | null; winnerId: string | null; type: 'win' | 'cancel' | null }>({ gameId: null, winnerId: null, type: null });
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newGame, setNewGame] = useState<NewGameState>({ title: '', entryFee: '', maxPlayers: '' });
    const [isCreatingGame, setIsCreatingGame] = useState(false);

    useEffect(() => {
        if (!firestore) return;
        setIsLoading(true);

        const gamesQuery = query(collection(firestore, 'games'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(gamesQuery, (snapshot) => {
            const fetchedGames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
            setGames(fetchedGames);
            setIsLoading(false);
        }, (err) => {
            console.error(err);
            toast.error("Failed to load games", { description: err.message });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [firestore]);

    const handleCreateGame = async () => {
        if (!firestore) return;
        const { title, entryFee, maxPlayers } = newGame;
        if (!title || !entryFee || !maxPlayers) {
            toast.error("All fields are required.");
            return;
        }

        setIsCreatingGame(true);
        try {
            await addDoc(collection(firestore, "games"), {
                gameTitle: title,
                entryFee: parseInt(entryFee, 10),
                maxPlayers: parseInt(maxPlayers, 10),
                status: 'waiting',
                players: [],
                createdAt: Timestamp.now(),
            });
            toast.success("Game created successfully!");
            setIsCreateDialogOpen(false);
            setNewGame({ title: '', entryFee: '', maxPlayers: '' });
        } catch (error: any) {
            toast.error("Error creating game:", { description: error.message });
        } finally {
            setIsCreatingGame(false);
        }
    };
    
    const handleAction = async () => {
        if (!actionState.gameId || !actionState.type || !functions) return;
        
        setIsSubmittingAction(true);
        const { gameId, winnerId, type } = actionState;
        
        let actionFn;
        let payload: any = { gameId };
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
            actionFn = httpsCallable(functions, 'cancelGameByAdmin');
            successMessage = "Game cancelled!";
        } else {
             setIsSubmittingAction(false);
            return;
        }

        try {
            await actionFn(payload);
            toast.success(successMessage);
            // No need to fetch, onSnapshot will update automatically
        } catch (err: any) {
            toast.error("Action failed", { description: err.message });
        } finally {
            setActionState({ gameId: null, winnerId: null, type: null });
            setIsSubmittingAction(false);
        }
    };
    
    // --- Column Definitions ---
    const columns: ColumnDef<Game>[] = useMemo(() => [
        {
            accessorKey: 'gameTitle',
            header: 'Game',
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.gameTitle}</div>
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
                const game = row.original;
                const isCancellable = game.status === 'waiting' || game.status === 'inprogress';
                const isDeclareWinnerEnabled = game.status === 'inprogress';

                return (
                    <AlertDialog onOpenChange={(open) => !open && setActionState({gameId: null, winnerId: null, type: null})}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => router.push(`/admin/games/${game.id}`)}><Eye className="mr-2 h-4 w-4"/>View Details</DropdownMenuItem>
                                
                                {isDeclareWinnerEnabled && (
                                    <AlertDialogTrigger asChild>
                                        <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-left" onClick={() => setActionState(prev => ({...prev, gameId: game.id}))}>
                                            <Crown className="mr-2 h-4 w-4"/>Declare Winner
                                        </button>
                                    </AlertDialogTrigger>
                                )}
                                {isCancellable && (
                                    <AlertDialogTrigger asChild>
                                         <button 
                                            onClick={() => setActionState({ gameId: game.id, winnerId: null, type: 'cancel' })}
                                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-left text-red-600 focus:text-red-600"
                                        >
                                            <XCircle className="mr-2 h-4 w-4"/>Cancel Game
                                        </button>
                                    </AlertDialogTrigger>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <AlertDialogContent>
                             <AlertDialogHeader>
                                <AlertDialogTitle>
                                    {actionState.type === 'cancel' ? `Cancel Game ${actionState.gameId}?` : `Declare Winner for Game ${game.id}`}
                                </AlertDialogTitle>
                                {actionState.type === 'cancel' ? (
                                    <AlertDialogDescription>This will refund all players' entry fees and change the game status to 'cancelled'. This action is irreversible.</AlertDialogDescription>
                                ) : (
                                    <AlertDialogDescription>Select a winner from the list of players. This action is irreversible and will distribute the prize pool.</AlertDialogDescription>
                                )}
                            </AlertDialogHeader>
                            {actionState.type !== 'cancel' && (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {game.players.map(p => (
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
        data: games,
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

    return (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Trophy className="mr-2"/> 
                    Game Command Center
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
                            <Button><PlusCircle className="mr-2 h-4 w-4"/> Create Game</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Game</DialogTitle>
                                <DialogDescription>Fill in the details below to create a new game.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="title" className="text-right">Title</Label>
                                    <Input id="title" value={newGame.title} onChange={(e) => setNewGame(prev => ({...prev, title: e.target.value}))} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="entry-fee" className="text-right">Entry Fee</Label>
                                    <Input id="entry-fee" type="number" value={newGame.entryFee} onChange={(e) => setNewGame(prev => ({...prev, entryFee: e.target.value}))} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="max-players" className="text-right">Max Players</Label>
                                    <Input id="max-players" type="number" value={newGame.maxPlayers} onChange={(e) => setNewGame(prev => ({...prev, maxPlayers: e.target.value}))} className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button variant={'outline'} disabled={isCreatingGame}>Cancel</Button></DialogClose>
                                <Button onClick={handleCreateGame} disabled={isCreatingGame}>
                                    {isCreatingGame && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
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
