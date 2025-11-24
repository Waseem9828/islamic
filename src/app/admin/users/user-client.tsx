'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase';
import { toast } from 'sonner';

import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { getCoreRowModel, getSortedRowModel, getFilteredRowModel, useReactTable } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, UserX, UserCheck, Eye, Wallet as WalletIcon } from 'lucide-react';

// --- Type Definitions ---
interface User {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
    status: 'active' | 'suspended';
    isAdmin: boolean;
    createdAt?: Timestamp;
}

interface Wallet {
    depositBalance: number;
    winningBalance: number;
    bonusBalance: number;
}

interface UserClientProps {
    initialUsers: User[];
}

// --- Main Client Component ---
export const UserClient = ({ initialUsers }: UserClientProps) => {
    const { firestore, functions } = useFirebase();
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
    const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);

    // --- Real-time User Updates ---
    useEffect(() => {
        if (!firestore) return;
        const q = query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const adminSnapshot = await getDocs(collection(firestore, 'roles_admin'));
            const adminIds = new Set(adminSnapshot.docs.map(doc => doc.id));
            const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, isAdmin: adminIds.has(doc.id) })) as User[];
            setUsers(usersData);
        });
        return () => unsubscribe();
    }, [firestore]);

    // --- API Calls ---
    const handleUpdateStatus = async (uid: string, status: 'active' | 'suspended') => {
        if (!functions) return;
        const updateUserStatus = httpsCallable(functions, 'updateUserStatus');
        try {
            await updateUserStatus({ uid, status });
            toast.success(`User ${status}`);
        } catch (error: any) {
            toast.error('Update failed', { description: error.message });
        }
    };

    const handleViewWallet = async (uid: string) => {
        if (!functions) return;
        const getWalletInfo = httpsCallable< { uid: string }, Wallet>(functions, 'getWalletInfo');
        try {
            const result = await getWalletInfo({ uid });
            setSelectedWallet(result.data);
            setIsWalletDialogOpen(true);
        } catch (error: any) {
            toast.error('Failed to get wallet', { description: error.message });
        }
    };

    // --- Table Column Definitions ---
    const columns: ColumnDef<User>[] = [
        { accessorKey: 'displayName', header: 'User', cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <Avatar><AvatarImage src={row.original.photoURL} /><AvatarFallback>{row.original.displayName?.[0]}</AvatarFallback></Avatar>
                <div>
                    <div className="font-medium">{row.original.displayName}</div>
                    <div className="text-sm text-muted-foreground">{row.original.email}</div>
                </div>
            </div>
        )},
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={row.original.status === 'active' ? 'success' : 'destructive'}>{row.original.status}</Badge> },
        { accessorKey: 'isAdmin', header: 'Role', cell: ({ row }) => row.original.isAdmin ? <Badge variant="secondary">Admin</Badge> : <Badge variant='outline'>User</Badge> },
        { accessorKey: 'createdAt', header: 'Registration Date', cell: ({ row }) => {
            const date = row.original.createdAt?.toDate();
            return date ? <div className="text-sm">{date.toLocaleDateString()}</div> : 'N/A';
        }},
        { id: 'actions', cell: ({ row }) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => alert('Viewing details for ' + row.original.displayName)}><Eye className="mr-2 h-4 w-4" /> View Full Details</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleViewWallet(row.original.id)}><WalletIcon className="mr-2 h-4 w-4" /> View Wallet</DropdownMenuItem>
                    {row.original.status === 'active' ? (
                        <DropdownMenuItem className="text-red-500" onClick={() => handleUpdateStatus(row.original.id, 'suspended')}><UserX className="mr-2 h-4 w-4" /> Suspend</DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem className="text-green-500" onClick={() => handleUpdateStatus(row.original.id, 'active')}><UserCheck className="mr-2 h-4 w-4" /> Activate</DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        )}
    ];

    // --- Table Instance ---
    const table = useReactTable({ data: users, columns, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), onSortingChange: setSorting, onGlobalFilterChange: setGlobalFilter, state: { sorting, globalFilter } });

    // --- Render Method ---
    return (
        <div className="p-4">
            <div className="flex items-center justify-between py-4">
                <Input placeholder="Filter by name, email..." value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} className="max-w-sm bg-white dark:bg-gray-800" />
            </div>
            <DataTable table={table} columns={columns} />
            
            {/* Wallet Details Dialog */}
            <AlertDialog open={isWalletDialogOpen} onOpenChange={setIsWalletDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>User Wallet Balance</AlertDialogTitle>
                        <AlertDialogDescription>
                            The current balances for the selected user.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {selectedWallet && (
                        <div className="grid gap-3 py-4">
                           <div className="flex justify-between items-center"><span className="font-medium text-muted-foreground">Deposit Balance:</span> <span className="font-bold text-lg">₹{selectedWallet.depositBalance.toLocaleString()}</span></div>
                           <div className="flex justify-between items-center"><span className="font-medium text-muted-foreground">Winning Balance:</span> <span className="font-bold text-lg">₹{selectedWallet.winningBalance.toLocaleString()}</span></div>
                           <div className="flex justify-between items-center"><span className="font-medium text-muted-foreground">Bonus Balance:</span> <span className="font-bold text-lg">₹{selectedWallet.bonusBalance.toLocaleString()}</span></div>
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setIsWalletDialogOpen(false)}>Close</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
