
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Timestamp, collection, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
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
import { MoreHorizontal, UserX, UserCheck, Eye, Wallet as WalletIcon, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { UsersDashboard } from '@/components/admin/UsersDashboard';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';


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

interface UserStats {
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    newToday: number;
    kycVerifiedUsers: number;
}

interface Wallet {
    depositBalance: number;
    winningBalance: number;
    bonusBalance: number;
}

const initialStats: UserStats = {
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    newToday: 0,
    kycVerifiedUsers: 0,
};

// --- Main Client Component ---
export const UserClient = () => {
    const { firestore, functions } = useFirebase();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<UserStats>(initialStats);
    const [isLoading, setIsLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
    const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);

    // --- Real-time User Updates ---
     useEffect(() => {
        if (!firestore) return;
        
        setIsLoading(true);
        const usersQuery = query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
        const adminsQuery = collection(firestore, 'roles_admin');

        const unsubAdmins = onSnapshot(adminsQuery, (adminSnapshot) => {
            const adminIds = new Set(adminSnapshot.docs.map(doc => doc.id));
            setUsers(currentUsers => currentUsers.map(u => ({
                ...u,
                isAdmin: adminIds.has(u.id)
            })));
        });

        const unsubUsers = onSnapshot(usersQuery, async (usersSnapshot) => {
            const adminSnapshot = await getDocs(adminsQuery);
            const adminIds = new Set(adminSnapshot.docs.map(doc => doc.id));
            
            const fetchedUsers = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                isAdmin: adminIds.has(doc.id)
            } as User));

            setUsers(fetchedUsers);

            // Calculate stats
            let activeUsers = 0;
            let blockedUsers = 0;
            let newToday = 0;
            const twentyFourHoursAgo = Timestamp.now().toMillis() - (24 * 60 * 60 * 1000);

            fetchedUsers.forEach(user => {
                if (user.status === 'active') activeUsers++;
                if (user.status === 'suspended') blockedUsers++;
                if (user.createdAt && user.createdAt.toMillis() > twentyFourHoursAgo) {
                    newToday++;
                }
            });

            setStats({
                totalUsers: fetchedUsers.length,
                activeUsers,
                blockedUsers,
                newToday,
                kycVerifiedUsers: 0 // Placeholder
            });

            setIsLoading(false);
        }, (err) => {
            console.error(err);
            toast.error("Failed to load users", { description: err.message });
            setIsLoading(false);
        });

        return () => {
            unsubUsers();
            unsubAdmins();
        }
    }, [firestore]);


    // --- API Calls ---
    const handleUpdateStatus = async (uid: string, status: 'active' | 'suspended') => {
        if (!functions) return;
        const updateUserStatus = httpsCallable(functions, 'updateUserStatus');
        try {
            await updateUserStatus({ uid, status });
            // The local state will be updated by the onSnapshot listener
            toast.success(`User ${status}`);
        } catch (error: any) {
            toast.error('Update failed', { description: error.message });
        }
    };

    const handleViewWallet = async (uid: string) => {
        if (!functions) return;
        const getWalletInfo = httpsCallable<{ uid: string }, Wallet>(functions, 'getWalletInfo');
        try {
            setIsWalletDialogOpen(true);
            const result = await getWalletInfo({ uid });
            setSelectedWallet(result.data);
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
        { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={row.original.status === 'active' ? 'default' : 'destructive'}>{row.original.status}</Badge> },
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
                    <DropdownMenuItem onClick={() => router.push(`/admin/users/${row.original.id}`)}><Eye className="mr-2 h-4 w-4" /> View Full Details</DropdownMenuItem>
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><User className="mr-2"/>User Management</CardTitle>
                <CardDescription>View, manage, and monitor all users on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-28 w-full mb-6" /> : <UsersDashboard stats={stats} />}

                <div>
                    <div className="flex items-center justify-between py-4">
                        <Input placeholder="Filter by name, email..." value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} className="max-w-sm" />
                    </div>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : (
                        <DataTable table={table} columns={columns} />
                    )}
                </div>
                
                {/* Wallet Details Dialog */}
                <AlertDialog open={isWalletDialogOpen} onOpenChange={(open) => {
                    if (!open) setSelectedWallet(null);
                    setIsWalletDialogOpen(open);
                }}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>User Wallet Balance</AlertDialogTitle>
                            <AlertDialogDescription>
                                The current balances for the selected user.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        {selectedWallet ? (
                            <div className="grid gap-3 py-4">
                               <div className="flex justify-between items-center"><span className="font-medium text-muted-foreground">Deposit Balance:</span> <span className="font-bold text-lg">₹{selectedWallet.depositBalance.toLocaleString()}</span></div>
                               <div className="flex justify-between items-center"><span className="font-medium text-muted-foreground">Winning Balance:</span> <span className="font-bold text-lg">₹{selectedWallet.winningBalance.toLocaleString()}</span></div>
                               <div className="flex justify-between items-center"><span className="font-medium text-muted-foreground">Bonus Balance:</span> <span className="font-bold text-lg">₹{selectedWallet.bonusBalance.toLocaleString()}</span></div>
                            </div>
                        ) : <Loader2 className="h-6 w-6 animate-spin mx-auto"/>}
                        <AlertDialogFooter>
                            <AlertDialogAction onClick={() => setIsWalletDialogOpen(false)}>Close</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
};

    