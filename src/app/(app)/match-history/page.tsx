
'use client';

import { useMemo } from 'react';
import { useFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function MatchHistoryPage() {
    const { user } = useUser();
    const { firestore } = useFirebase();

    const matchesQuery = useMemo(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'matches'),
            where('players', 'array-contains', user.uid),
            orderBy('createdAt', 'desc')
        );
    }, [user, firestore]);

    const { data: matches, isLoading } = useCollection(matchesQuery);

    const getStatusBadge = (status: string) => {
        const variants: {[key: string]: 'default' | 'destructive' | 'secondary' | 'outline'} = {
            completed: 'default',
            cancelled: 'destructive',
            waiting: 'secondary',
            inprogress: 'outline',
        };
        return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
    };

    return (
        <div className="container mx-auto max-w-4xl py-6 animate-fade-in-up">
            <Card>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : matches && matches.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Match</TableHead>
                                    <TableHead>Fee</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Result</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {matches.map((match, index) => {
                                    const isWinner = match.winner === user?.uid;
                                    return (
                                        <TableRow key={match.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                                            <TableCell>
                                                <div className="font-medium">{match.matchTitle}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{match.id}</div>
                                            </TableCell>
                                            <TableCell>{formatCurrency(match.entryFee)}</TableCell>
                                            <TableCell>{getStatusBadge(match.status)}</TableCell>
                                            <TableCell className={`font-semibold ${isWinner ? 'text-green-600' : ''}`}>
                                                {match.status === 'completed' ? (
                                                    isWinner ? `Won ${formatCurrency(match.winnings || 0)}` : 'Lost'
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right text-xs">{formatDate(match.createdAt)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <h3 className="text-lg font-semibold">No Matches Found</h3>
                            <p className="text-muted-foreground mt-1">You haven't played any matches yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
