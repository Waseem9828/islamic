'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ type: 'all', reason: 'all', status: 'all' });

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
        const searchLower = search.toLowerCase();
        const searchMatch = !search || 
            (tx.user?.displayName?.toLowerCase().includes(searchLower)) || 
            (tx.user?.email?.toLowerCase().includes(searchLower)) || 
            tx.userId.toLowerCase().includes(searchLower) || 
            tx.id.toLowerCase().includes(searchLower) || 
            (tx.matchId && tx.matchId.toLowerCase().includes(searchLower));
        
        const typeMatch = filters.type === 'all' || tx.type === filters.type;
        const reasonMatch = filters.reason === 'all' || tx.reason === filters.reason;
        const statusMatch = filters.status === 'all' || tx.status === filters.status;
        return searchMatch && typeMatch && reasonMatch && statusMatch;
    });
  }, [transactions, search, filters]);

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

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><History className="mr-2"/>All Transactions</CardTitle>
          <CardDescription>A complete, real-time history of all financial activities across the platform.</CardDescription>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
                <Input placeholder="Search Name, Email, User ID, TXN ID..." value={search} onChange={e => setSearch(e.target.value)} className="md:col-span-2" />
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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Reference</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions.map(tx => (
                            <TableRow key={tx.id}>
                                <TableCell>
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
                                </TableCell>
                                <TableCell>
                                    {tx.type === 'credit' ? 
                                    <span className='flex items-center text-green-600 font-medium'><ArrowDownLeft className="h-4 w-4 mr-1"/>Credit</span> : 
                                    <span className='flex items-center text-red-600 font-medium'><ArrowUpRight className="h-4 w-4 mr-1"/>Debit</span>}
                                </TableCell>
                                <TableCell className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>₹{tx.amount.toFixed(2)}</TableCell>
                                <TableCell className="capitalize">{tx.reason.replace(/_/g, ' ')}</TableCell>
                                <TableCell>{getStatusBadge(tx.status)}</TableCell>
                                <TableCell className="font-mono text-xs max-w-[120px] truncate">
                                    {tx.matchId ? <Link href={`/match/${tx.matchId}`} className="hover:underline" title={tx.matchId}>Match: {tx.matchId}</Link> : tx.id}
                                </TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground">{format(tx.timestamp.toDate(), 'PPp')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
            {!loading && filteredTransactions.length === 0 && <p className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">No transactions found for the selected filters.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
