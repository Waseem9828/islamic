'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase';
import { toast } from 'sonner';

import type { ColumnDef, SortingState, VisibilityState } from '@tanstack/react-table';
import { getCoreRowModel, getSortedRowModel, getFilteredRowModel, useReactTable } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table'; // Assume this component is created
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, UserX, UserCheck, Eye } from 'lucide-react';

// Define the User and Wallet types
interface User {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
    status: 'active' | 'suspended';
    isAdmin: boolean;
}

interface Wallet {
    depositBalance: number;
    winningBalance: number;
    bonusBalance: number;
    lifetimeBonus: number;
}

// Props for the client component
interface UserClientProps {
    initialUsers: User[];
}

// --- Main Client Component ---
export const UserClient = ({ initialUsers }: UserClientProps) => {
    const { firestore, functions } = useFirebase();
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);

    // Listen for real-time user updates
    useEffect(() => {
        if (!firestore) return;
        const q = query(collection(firestore, 'users'), orderBy('displayName'));
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const usersData: User[] = [];
            const adminRoles = new Map<string, boolean>();
            const adminSnapshot = await collection(firestore, 'roles_admin').get();
            adminSnapshot.forEach(doc => adminRoles.set(doc.id, true));

            querySnapshot.forEach(doc => {
                const data = doc.data();
                usersData.push({
                    id: doc.id,
                    displayName: data.displayName,
                    email: data.email,
                    photoURL: data.photoURL,
                    status: data.status || 'active',
                    isAdmin: adminRoles.has(doc.id)
                });
            });
            setUsers(usersData);
        });
        return () => unsubscribe();
    }, [firestore]);

    // Handle user status change (suspend/activate)
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

    const columns: ColumnDef<User>[] = [
        {
            accessorKey: 'displayName',
            header: 'User',
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={user.photoURL} />
                            <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">{user.displayName}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                return <Badge variant={status === 'active' ? 'default' : 'destructive'}>{status}</Badge>;
            },
        },
         {
            accessorKey: 'isAdmin',
            header: 'Role',
            cell: ({ row }) => {
                const isAdmin = row.original.isAdmin;
                return isAdmin ? <Badge variant="secondary">Admin</Badge> : 'User';
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => alert('Viewing details for ' + user.displayName)}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            {user.status === 'active' ? (
                                <DropdownMenuItem className="text-red-500" onClick={() => handleUpdateStatus(user.id, 'suspended')}>
                                    <UserX className="mr-2 h-4 w-4" /> Suspend
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem className="text-green-500" onClick={() => handleUpdateStatus(user.id, 'active')}>
                                    <UserCheck className="mr-2 h-4 w-4" /> Activate
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const table = useReactTable({
        data: users,
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

    return (
        <div>
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter by name, email..."
                    value={globalFilter ?? ''}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    className="max-w-sm"
                />
            </div>
            <DataTable table={table} columns={columns} />
        </div>
    );
};
