
'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser } from '@/firebase';
import { collection, doc, query, where, orderBy } from 'firebase/firestore';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownLeft, ArrowUpRight, Wallet, PiggyBank, Trophy, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const WalletStatCard = ({ title, value, icon: Icon, isLoading, className = '' }: { title: string, value: number, icon: React.ElementType, isLoading: boolean, className?: string }) => (
    <div className={`p-4 rounded-lg flex items-start justify-between ${className}`}>
        <div>
            <p className="text-sm font-medium text-white/80">{title}</p>
            {isLoading ? <Skeleton className="h-7 w-24 mt-1 bg-white/20" /> : <p className="text-2xl font-bold text-white">₹{value?.toFixed(2) || '0.00'}</p>}
        </div>
        <Icon className="h-8 w-8 text-white/50" />
    </div>
);

const HistoryTable = ({ history, isLoading, type }: { history: any[], isLoading: boolean, type: 'Deposit' | 'Withdrawal' | 'All' }) => {
    if (isLoading) {
        return <div className="space-y-2 p-4"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>;
    }
    if (history.length === 0) {
        return <p className="text-center text-muted-foreground py-8">No {type !== 'All' && type.toLowerCase()} history.</p>;
    }
    
    return (
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
                {history.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium capitalize">{item.reason?.replace('_', ' ') || item.type}</TableCell>
                        <TableCell className={`font-semibold ${item.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                           {item.type === 'credit' ? '+' : '-'}₹{item.amount.toFixed(2)}
                        </TableCell>
                        <TableCell><Badge variant={item.status === 'approved' || item.status === 'completed' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'}>{item.status}</Badge></TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                            {item.timestamp ? format(item.timestamp.toDate(), 'PPp') : 'N/A'}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export default function WalletPage() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const router = useRouter();

    const walletRef = useMemo(() => user ? doc(firestore!, 'wallets', user.uid) : null, [user, firestore]);
    const [walletData, isWalletLoading] = useDocumentData(walletRef);
    
    const transactionsQuery = useMemo(() => user ? query(
        collection(firestore!, 'transactions'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
    ) : null, [user, firestore]);
    const [transactions, isHistoryLoading] = useCollectionData(transactionsQuery);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const walletBalances = {
        deposit: walletData?.depositBalance || 0,
        bonus: walletData?.bonusBalance || 0,
        winning: walletData?.winningBalance || 0,
        total: (walletData?.depositBalance || 0) + (walletData?.bonusBalance || 0) + (walletData?.winningBalance || 0),
    };

    return (
        <div className="container mx-auto max-w-4xl py-8">
            <Card className="mb-6 bg-gradient-to-br from-primary to-purple-600 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        <Wallet className="mr-2" /> My Wallet
                    </CardTitle>
                    <CardDescription className="text-white/80">
                        Your central place for all funds and transactions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <WalletStatCard title="Deposit Balance" value={walletBalances.deposit} icon={Wallet} isLoading={isWalletLoading} className="bg-white/10" />
                   <WalletStatCard title="Winning Balance" value={walletBalances.winning} icon={Trophy} isLoading={isWalletLoading} className="bg-white/10" />
                   <WalletStatCard title="Bonus Balance" value={walletBalances.bonus} icon={PiggyBank} isLoading={isWalletLoading} className="bg-white/10" />
                </CardContent>
            </Card>

             <Card className="mb-6">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Actions</CardTitle>
                        <div className='text-right'>
                            <p className='text-sm text-muted-foreground'>Total Balance</p>
                            {isWalletLoading ? <Skeleton className="h-7 w-28 mt-1" /> : <p className="text-2xl font-bold">₹{walletBalances.total.toFixed(2)}</p>}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button size="lg" className="h-16 text-lg" onClick={() => router.push('/deposit')}>
                        <ArrowDownLeft className="mr-2 h-6 w-6"/> Deposit Money
                    </Button>
                    <Button size="lg" variant="outline" className="h-16 text-lg" onClick={() => router.push('/withdraw')}>
                        <ArrowUpRight className="mr-2 h-6 w-6"/> Withdraw Winnings
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>A record of all your financial activities.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <HistoryTable history={transactions || []} isLoading={isHistoryLoading} type="All" />
                </CardContent>
            </Card>
        </div>
    );
}
