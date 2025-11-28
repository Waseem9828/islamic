'use client';

import { useMemo } from 'react';
import { useUser, useFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownLeft, ArrowUpRight, Banknote } from 'lucide-react';
import { format } from 'date-fns';

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

// Helper to format date
const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  return format(timestamp.toDate(), "PPp");
};

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
        return <Badge>{status}</Badge>;
    }
};

const getReasonText = (reason: string, matchId?: string) => {
    const reasonMap: {[key: string]: string} = {
        'deposit': 'Deposit',
        'withdrawal_request': 'Withdrawal',
        'match_creation': 'Match Entry Fee',
        'match_join': 'Match Entry Fee',
        'match_win': 'Match Winnings',
        'match_cancellation_refund': 'Match Refund',
        'bonus': 'Bonus Credit',
    }
    const text = reasonMap[reason] || reason.replace(/_/g, ' ');
    return (
        <div className='flex flex-col'>
            <span className='capitalize'>{text}</span>
            {matchId && <Link href={`/match/${matchId}`} className='text-xs text-muted-foreground hover:underline font-mono'>{matchId}</Link>}
        </div>
    )
}

export default function AllTransactionsPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();

  const transactionsQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
  }, [user, firestore]);

  const { data: transactions, isLoading } = useCollection(transactionsQuery);

  return (
    <div className="container mx-auto max-w-4xl py-6">
        <Card>
        <CardContent className="pt-6">
            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : transactions && transactions.length > 0 ? (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Details</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {transactions.map(tx => (
                    <TableRow key={tx.id}>
                        <TableCell className="font-medium capitalize flex items-center">
                            {tx.type === 'credit' ? <ArrowDownLeft className="h-5 w-5 mr-3 text-green-500"/> : <ArrowUpRight className="h-5 w-5 mr-3 text-red-500"/>}
                            {getReasonText(tx.reason, tx.matchId)}
                        </TableCell>
                        <TableCell className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(tx.amount)}</TableCell>
                        <TableCell>{getStatusBadge(tx.status)}</TableCell>
                        <TableCell className="text-right text-xs">{formatDate(tx.timestamp)}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            ) : (
            <p className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">No transactions yet.</p>
            )}
      </CardContent>
      </Card>
    </div>
  );
}
