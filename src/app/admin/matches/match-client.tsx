'use client';

import { useState, useMemo, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase/provider';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, XCircle, Crown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { getCoreRowModel, getSortedRowModel, getFilteredRowModel, useReactTable } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

// Types
interface Match {
    id: string;
    matchTitle: string;
    status: 'waiting' | 'inprogress' | 'completed' | 'cancelled' | 'archived';
    entry: number;
    maxPlayers: number;
    players: string[];
    createdAt: any; // Timestamp
    winner?: string;
}

// --- Client Component ---
export const MatchClient = () => {
    const { functions } = useFirebase();
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
    const [actionState, setActionState] = useState<{ matchId: string | null; winnerId: string | null; type: 'win' | 'cancel' | null }>({ matchId: null, winnerId: null, type: null });
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);

    const fetchMatches = async () => {
        if (!functions) return;
        setIsLoading(true);
        const getMatchesFn = httpsCallable(functions, 'getMatches');
        try {
            const result = await getMatchesFn();
            const data = result.data as { matches: Match[] };
            setMatches(data.matches);
        } catch (err: any) {
            toast.error("Failed to load matches", { description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, [functions]);
    
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
            fetchMatches(); // Re-fetch matches to update the list
        } catch (err: any) {
            toast.error("Action failed", { description: err.message });
        } finally {
            setActionState({ matchId: null, winnerId: null, type: null });
            setIsSubmittingAction(false);
        }
    };
    
    // --- Column Definitions ---
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
            accessorKey: 'entry',
            header: 'Entry Fee',
            cell: ({ row }) => `₹${row.original.entry}`
        },
        {
            accessorKey: 'players',
            header: 'Players',
            cell: ({ row }) => `${row.original.players.length} / ${row.original.maxPlayers}`
        },
        {
            accessorKey: 'createdAt',
            header: 'Created At',
            cell: ({ row }) => format(row.original.createdAt.toDate(), 'PPp')
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
                                <DropdownMenuItem onClick={() => alert(`Viewing match ${match.id}`)}><Eye className="mr-2 h-4 w-4"/>View Details</DropdownMenuItem>
                                
                                {isDeclareWinnerEnabled && (
                                    <AlertDialogTrigger asChild>
                                        <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-left">
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
                            </AlertDialogHeader>
                            {actionState.type === 'cancel' ? (
                                <AlertDialogDescription>This will refund all players' entry fees and change the match status to 'cancelled'. This action is irreversible.</AlertDialogDescription>
                            ) : (
                                <>
                                <AlertDialogDescription>Select a winner from the list of players. This action is irreversible and will distribute the prize pool.</AlertDialogDescription>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {match.players.map(p => (
                                        <Button key={p} variant={actionState.winnerId === p ? 'default' : 'outline'} className='w-full justify-start' onClick={() => setActionState(prev => ({ ...prev, winnerId: p, type: 'win' }))}>
                                            <Crown className="mr-2 h-4 w-4"/> Declare <span className="font-mono mx-2 p-1 bg-muted rounded text-xs">{p}</span> as Winner
                                        </Button>
                                    ))}
                                </div>
                                </>
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
    ], [functions, actionState, isSubmittingAction]);

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
         <div>
            <div className="flex items-center py-4">
                <Input
                    placeholder="Search by title or ID..."
                    value={globalFilter ?? ''}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    className="max-w-sm"
                />
            </div>
            <DataTable table={table} columns={columns} />
        </div>
    );
};
