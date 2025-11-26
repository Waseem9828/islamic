
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { getCoreRowModel, getSortedRowModel, getFilteredRowModel, useReactTable } from '@tanstack/react-table';


interface User {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

interface Transaction {
  id: string;
  amount: number;
  userId: string;
  type: 'credit' | 'debit';
  reason: string;
  status: string;
  timestamp: { toDate: () => Date };
  matchId?: string;
}

type TransactionWithUser = Transaction & { user?: User };

export default function AllTransactionsPage() {
  const { firestore } = useFirebase(); 
  const [transactions, setTransactions] = useState<TransactionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState({ type: 'all', reason: 'all', status: 'all' });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'timestamp', desc: true }]);


  useEffect(() => {
    if (!firestore) return;

    const transQuery = query(collection(firestore, 'transactions'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(transQuery, async (snapshot) => {
        const fetchedTransactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        
        const userCache = new Map<string, User>();
        const transactionsWithUsers = await Promise.all(fetchedTransactions.map(async (tx) => {
            if (userCache.has(tx.userId)) {
                return { ...tx, user: userCache.get(tx.userId) };
            }
            try {
                const userDoc = await getDoc(doc(firestore, 'users', tx.userId));
                if (userDoc.exists()) {
                    const userData = { id: userDoc.id, ...userDoc.data() } as User;
                    userCache.set(tx.userId, userData);
                    return { ...tx, user: userData };
                }
            } catch (e) {
                console.error(`Failed to fetch user ${tx.userId}`, e);
            }
            return { ...tx, user: undefined };
        }));

        setTransactions(transactionsWithUsers);
        setLoading(false);
    }, (error) => {
        console.error("Failed to fetch transactions:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
        const typeMatch = filters.type === 'all' || tx.type === filters.type;
        const reasonMatch = filters.reason === 'all' || tx.reason === filters.reason;
        const statusMatch = filters.status === 'all' || tx.status === filters.status;
        return typeMatch && reasonMatch && statusMatch;
    });
  }, [transactions, filters]);

  const uniqueReasons = useMemo(() => [...new Set(transactions.map(tx => tx.reason))], [transactions]);
  const uniqueStatuses = useMemo(() => [...new Set(transactions.map(tx => tx.status))], [transactions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'approved':
        case 'success':
        case 'completed':
            return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Completed</Badge>;
        case 'pending':
            return <Badge variant="secondary">Pending</Badge>;
        case 'rejected':
        case 'cancelled':
            return <Badge variant="destructive">Failed</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<TransactionWithUser>[] = useMemo(() => [
    {
        accessorKey: 'user',
        header: 'User',
        cell: ({ row }) => {
            const tx = row.original;
            return (
                <Link href={`/admin/users?search=${tx.userId}`} className="flex items-center gap-2 hover:bg-muted p-1 rounded-md transition-colors">
                    <Avatar className="h-9 w-9 border">
                        <AvatarImage src={tx.user?.photoURL || undefined} />
                        <AvatarFallback>{tx.user?.displayName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-sm">{tx.user?.displayName || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground font-mono">{tx.userId}</p>
                    </div>
                </Link>
            )
        }
    },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => (
        row.original.type === 'credit' ? 
        <span className='flex items-center text-green-600 font-medium'><ArrowDownLeft className="h-4 w-4 mr-1"/>Credit</span> : 
        <span className='flex items-center text-red-600 font-medium'><ArrowUpRight className="h-4 w-4 mr-1"/>Debit</span>
    )},
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <div className={`font-semibold ${row.original.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>₹{row.original.amount.toFixed(2)}</div>},
    { accessorKey: 'reason', header: 'Reason', cell: ({ row }) => <div className="capitalize">{row.original.reason.replace(/_/g, ' ')}</div> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => getStatusBadge(row.original.status) },
    { accessorKey: 'id', header: 'Reference', cell: ({ row }) => (
        <div className="font-mono text-xs max-w-[120px] truncate">
            {row.original.matchId ? <Link href={`/match/${row.original.matchId}`} className="hover:underline" title={row.original.matchId}>Match: {row.original.matchId}</Link> : row.original.id}
        </div>
    )},
    { accessorKey: 'timestamp', header: 'Date', cell: ({ row }) => <div className="text-right text-xs text-muted-foreground">{format(row.original.timestamp.toDate(), 'PPp')}</div> }
  ], []);

  const table = useReactTable({
    data: filteredTransactions,
    columns,
    state: { sorting, globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><History className="mr-2"/>All Transactions</CardTitle>
        <CardDescription>A complete, real-time history of all financial activities across the platform.</CardDescription>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
              <Input placeholder="Search Name, Email, User ID, TXN ID..." value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} className="md:col-span-2" />
               <Select value={filters.type} onValueChange={v => handleFilterChange('type', v)}>
                  <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
              </Select>
               <Select value={filters.status} onValueChange={v => handleFilterChange('status', v)}>
                  <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {uniqueStatuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
              </Select>
          </div>
      </CardHeader>
      <CardContent>
          {loading && (
              <div className="space-y-2">
                  {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
          )}
          {!loading && (
             <DataTable table={table} columns={columns} />
          )}
      </CardContent>
    </Card>
  );
}
