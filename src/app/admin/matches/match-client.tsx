'use client';

import { useState, useEffect, useMemo } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase/provider';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, XCircle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { getCoreRowModel, getSortedRowModel, getFilteredRowModel, useReactTable } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';

// Types
interface Match {
    id: string;
    matchTitle: string;
    status: 'waiting' | 'inprogress' | 'completed' | 'cancelled' | 'archived';
    entryFee: number;
    maxPlayers: number;
    players: string[];
    createdAt: any; // Timestamp
    winner?: string;
}

// --- Column Definitions ---
const getColumns = (actions: {
    onDeclareWinner: (matchId: string, winnerId: string) => void;
    onCancel: (matchId: string) => void;
    onView: (matchId: string) => void;
}): ColumnDef<Match>[] => [
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
            return <Badge variant={variantMap[row.original.status] || 'secondary'}>{row.original.status}</Badge>;
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
        cell: ({ row }) => format(row.original.createdAt.toDate(), 'PPp')
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const match = row.original;
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => actions.onView(match.id)}><Eye className="mr-2 h-4 w-4"/>View Details</DropdownMenuItem>
                        {(match.status === 'waiting' || match.status === 'inprogress') && (
                            <AlertDialog>
                                {/* TODO: Replace with a proper winner selection dialog */}
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Declare Winner</AlertDialogTitle></AlertDialogHeader>
                                    <AlertDialogDescription>Select a winner from the list of players.</AlertDialogDescription>
                                     {/* This should be a select dropdown */}
                                    <Button onClick={() => actions.onDeclareWinner(match.id, match.players[0])}>Declare {match.players[0]} as Winner</Button>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                         {(match.status === 'waiting' || match.status === 'inprogress') && (
                            <DropdownMenuItem className='text-red-500' onClick={() => actions.onCancel(match.id)}><XCircle className="mr-2 h-4 w-4"/>Cancel Match</DropdownMenuItem>
                         )}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
    }
];

// --- Client Component ---
export const MatchClient = () => {
    const { functions } = useFirebase();
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);

    useEffect(() => {
        if (!functions) return;
        const getMatches = httpsCallable(functions, 'getMatches');
        getMatches()
            .then(result => {
                const data = result.data as { matches: Match[] };
                setMatches(data.matches);
            })
            .catch(err => toast.error("Failed to load matches", { description: err.message }))
            .finally(() => setIsLoading(false));
    }, [functions]);
    
    const handleAction = async (action: any, payload: any, successMessage: string) => {
        try {
            await action(payload);
            toast.success(successMessage);
            // Optionally re-fetch matches here
        } catch (err: any) {
            toast.error("Action failed", { description: err.message });
        }
    };

    const actions = {
        onDeclareWinner: (matchId: string, winnerId: string) => 
            handleAction(httpsCallable(functions, 'distributeWinnings'), { matchId, winnerId }, "Winner declared!"),
        onCancel: (matchId: string) => 
            handleAction(httpsCallable(functions, 'cancelMatch'), { matchId }, "Match cancelled!"),
        onView: (matchId: string) => alert(`Viewing match ${matchId}`),
    };

    const columns = useMemo(() => getColumns(actions), [actions]);

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
        return <div>Loading matches...</div>;
    }

    return (
         <div>
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter by title or ID..."
                    value={globalFilter ?? ''}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    className="max-w-sm"
                />
            </div>
            <DataTable table={table} columns={columns} />
        </div>
    );
};