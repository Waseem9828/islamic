'use client';

import { useMemo } from 'react';
import { useUser } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownLeft, ArrowUpRight, Banknote } from 'lucide-react';

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

// Helper to format date
const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp.seconds * 1000).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
};

export function TransactionsHistory() {
  const { user } = useUser();
  const { firestore } = useFirebase();

  // Create a query to get transactions for the current user, ordered by date
  const transactionsQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  // Use the useCollection hook to fetch the data
  const { data: transactions, loading } = useCollection(transactionsQuery);

  // Calculate total deposits and withdrawals
  const { totalDeposits, totalWithdrawals } = useMemo(() => {
    if (!transactions) return { totalDeposits: 0, totalWithdrawals: 0 };

    return transactions.reduce((acc, trans) => {
        if (trans.status !== 'approved') return acc; // Only count approved transactions

        if (trans.type === 'deposit') {
            acc.totalDeposits += trans.amount;
        } else if (trans.type === 'withdrawal') {
            acc.totalWithdrawals += trans.amount;
        }
        return acc;
    }, { totalDeposits: 0, totalWithdrawals: 0 });

  }, [transactions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center"><Banknote className="mr-2"/>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Deposits</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalDeposits)}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Withdrawals</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(totalWithdrawals)}</p>
              </div>
          </div>

        {loading ? (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        ) : transactions && transactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium capitalize flex items-center">
                    {tx.type === 'deposit' ? <ArrowDownLeft className="h-4 w-4 mr-2 text-green-500"/> : <ArrowUpRight className="h-4 w-4 mr-2 text-red-500"/>}
                    {tx.type}
                  </TableCell>
                  <TableCell>{formatCurrency(tx.amount)}</TableCell>
                  <TableCell>{getStatusBadge(tx.status)}</TableCell>
                  <TableCell className="text-right">{formatDate(tx.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-6">No transactions yet.</p>
        )}
      </CardContent>
      {
        !loading && transactions && transactions.length > 5 && (
            <CardFooter className="text-center text-muted-foreground text-sm">
                <p>Showing last {transactions.length} transactions.</p>
            </CardFooter>
        )
      }
    </Card>
  );
}