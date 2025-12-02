
'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownLeft, ArrowUpRight, IndianRupee, Trophy, TrendingUp, TrendingDown, History } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { getCoreRowModel, getSortedRowModel, getFilteredRowModel, useReactTable } from '@tanstack/react-table';

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

// Helper to format date
const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  return format(timestamp.toDate(), "PPp");
};

const StatCard = ({ title, value, icon: Icon, className }: { title: string, value: string, icon: React.ElementType, className?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={`h-4 w-4 text-muted-foreground ${className}`} />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'success':
      case 'completed':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
      case 'failed':
      case 'cancelled':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
};

const getReasonText = (reason: string, matchId?: string) => {
    const reasonMap: {[key: string]: string} = {
        'deposit': 'Deposit Approved',
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
            <span className='capitalize font-medium'>{text}</span>
            {matchId && <Link href={`/match/${matchId}`} className='text-xs text-muted-foreground hover:underline font-mono'>Match: {matchId}</Link>}
        </div>
    )
}

export default function AllTransactionsPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'timestamp', desc: true }]);

  const transactionsQuery = useMemo(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/transactions`),
      orderBy('timestamp', 'desc')
    );
  }, [user, firestore]);

  const { data: transactions, isLoading } = useCollection(transactionsQuery);
  
  const stats = useMemo(() => {
      if (!transactions) return { totalCredit: 0, totalDebit: 0, netBalance: 0, totalWinnings: 0 };
      
      const totalCredit = transactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + t.amount, 0);
      const totalDebit = transactions.filter(t => t.type === 'debit').reduce((acc, t) => acc + t.amount, 0);
      const totalWinnings = transactions.filter(t => t.reason === 'match_win').reduce((acc, t) => acc + t.amount, 0);

      return {
          totalCredit,
          totalDebit,
          netBalance: totalCredit - totalDebit,
          totalWinnings
      }
  }, [transactions]);


  const columns: ColumnDef<any>[] = useMemo(() => [
    {
        accessorKey: 'reason',
        header: 'Details',
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                 {row.original.type === 'credit' ? <ArrowDownLeft className="h-5 w-5 text-green-500"/> : <ArrowUpRight className="h-5 w-5 text-red-500"/>}
                 {getReasonText(row.original.reason, row.original.matchId)}
            </div>
        )
    },
    { 
        accessorKey: 'amount', 
        header: 'Amount', 
        cell: ({ row }) => (
            <div className={`font-semibold ${row.original.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                {row.original.type === 'credit' ? '+' : '-'}
                {formatCurrency(row.original.amount)}
            </div>
        )
    },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => getStatusBadge(row.original.status) },
    { accessorKey: 'timestamp', header: 'Date', cell: ({ row }) => <div className="text-right text-xs text-muted-foreground">{formatDate(row.original.timestamp)}</div>, enableSorting: true }
  ], []);

  const table = useReactTable({
    data: transactions || [],
    columns,
    state: { sorting, globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="container mx-auto max-w-7xl py-6 space-y-6">
        <Card>
             <CardHeader>
                <CardTitle className="flex items-center"><History className="mr-2"/>Transaction Analysis</CardTitle>
                <CardDescription>A complete analysis of your financial activity.</CardDescription>
            </CardHeader>
        </Card>

        {isLoading ? (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>
        ) : (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Credited" value={formatCurrency(stats.totalCredit)} icon={TrendingUp} className="text-green-500" />
                <StatCard title="Total Debited" value={formatCurrency(stats.totalDebit)} icon={TrendingDown} className="text-red-500" />
                <StatCard title="Net Balance" value={formatCurrency(stats.netBalance)} icon={IndianRupee} />
                <StatCard title="Total Winnings" value={formatCurrency(stats.totalWinnings)} icon={Trophy} className="text-yellow-500" />
            </div>
        )}

        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Detailed History</CardTitle>
                        <CardDescription>All your transactions are listed below.</CardDescription>
                    </div>
                     <Input
                        placeholder="Search transactions..."
                        value={globalFilter ?? ''}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="max-w-sm"
                    />
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : (
                    <DataTable table={table} columns={columns} />
                )}
            </CardContent>
      </Card>
    </div>
  );
}
