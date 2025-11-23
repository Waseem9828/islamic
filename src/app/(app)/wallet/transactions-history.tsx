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
import { format } from 'date-fns';

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

// Helper to format date
const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  return format(new Date(timestamp.seconds * 1000), 'PPp');
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
      orderBy('timestamp', 'desc')
    );
  }, [user, firestore]);

  // Use the useCollection hook to fetch the data
  const { data: transactions, isLoading } = useCollection(transactionsQuery);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
      case 'cancelled':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
    const getReasonText = (reason: string) => {
        const reasonMap: {[key: string]: string} = {
            'deposit': 'Deposit',
            'withdrawal_request': 'Withdrawal',
            'match_creation': 'Match Entry',
            'match_join': 'Match Entry',
            'match_win': 'Match Winnings',
            'match_cancellation_refund': 'Match Refund',
            'bonus': 'Bonus Credit',
        }
        return reasonMap[reason] || reason.replace(/_/g, ' ');
    }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center"><Banknote className="mr-2"/>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="space-y-2">
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
              {transactions.slice(0, 5).map(tx => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium capitalize flex items-center">
                    {tx.type === 'credit' ? <ArrowDownLeft className="h-4 w-4 mr-2 text-green-500"/> : <ArrowUpRight className="h-4 w-4 mr-2 text-red-500"/>}
                    {getReasonText(tx.reason)}
                  </TableCell>
                  <TableCell className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(tx.amount)}</TableCell>
                  <TableCell>{getStatusBadge(tx.status)}</TableCell>
                  <TableCell className="text-right text-xs">{formatDate(tx.timestamp)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-6">No transactions yet.</p>
        )}
      </CardContent>
      {
        !isLoading && transactions && transactions.length > 5 && (
            <CardFooter className="text-center text-muted-foreground text-sm justify-center">
                <p>Showing last 5 transactions. <a href="/transactions" className='text-primary hover:underline'>View All</a></p>
            </CardFooter>
        )
      }
    </Card>
  );
}
