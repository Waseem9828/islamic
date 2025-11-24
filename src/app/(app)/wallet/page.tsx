
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser } from '@/firebase';
import { collection, doc, query, where, orderBy, limit, onSnapshot, DocumentData } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownLeft, ArrowUpRight, Wallet, PiggyBank, Trophy, Loader2, History } from 'lucide-react';
import { format } from 'date-fns';

const WalletStatCard = ({ title, value, icon: Icon, isLoading, className = '' }: { title: string, value: number, icon: React.ElementType, isLoading: boolean, className?: string }) => (
    <div className={`p-4 rounded-lg flex items-center justify-between ${className}`}>
        <div>
            <p className="text-sm font-medium text-white/80">{title}</p>
            {isLoading ? <Skeleton className="h-7 w-24 mt-1 bg-white/20" /> : <p className="text-2xl font-bold text-white">₹{value?.toFixed(2) || '0.00'}</p>}
        </div>
        <Icon className="h-8 w-8 text-white/50" />
    </div>
);

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

// Helper to format date and time
const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  return format(timestamp.toDate(), "PPp"); // e.g., Jun 20, 2024, 5:30 PM
};

const getReasonText = (reason: string) => {
    const reasonMap: {[key: string]: string} = {
        'deposit': 'Deposit',
        'withdrawal_request': 'Withdrawal',
        'match_creation': 'Match Entry Fee',
        'match_join': 'Match Entry Fee',
        'match_win': 'Match Winnings',
        'match_cancellation_refund': 'Match Refund',
        'bonus': 'Bonus Credit',
    }
    return reasonMap[reason] || reason.replace(/_/g, ' ');
}

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

export default function WalletPage() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const router = useRouter();

    const [walletData, setWalletData] = useState<DocumentData | null>(null);
    const [transactions, setTransactions] = useState<DocumentData[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || !firestore) {
            if (!isUserLoading) {
                router.push('/login');
            }
            return;
        }

        setIsLoading(true);

        const walletRef = doc(firestore, 'wallets', user.uid);
        const transactionsQuery = query(
            collection(firestore, 'transactions'),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc'),
            limit(10)
        );

        const unsubWallet = onSnapshot(walletRef, (doc) => {
            setWalletData(doc.data() ?? null);
            // Don't stop loading until both snapshots are received
        }, (error) => {
            console.error("Error fetching wallet data:", error);
            setIsLoading(false);
        });

        const unsubTransactions = onSnapshot(transactionsQuery, (snapshot) => {
            setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false); // Stop loading after transactions are fetched
        }, (error) => {
            console.error("Error fetching transactions data:", error);
            setIsLoading(false);
        });

        // Cleanup function
        return () => {
            unsubWallet();
            unsubTransactions();
        };

    }, [user, firestore, isUserLoading, router]);

    const walletBalances = useMemo(() => {
        const deposit = walletData?.depositBalance || 0;
        const bonus = walletData?.bonusBalance || 0;
        const winning = walletData?.winningBalance || 0;
        return {
            deposit,
            bonus,
            winning,
            total: deposit + bonus + winning,
        };
    }, [walletData]);

    if (isUserLoading || (!walletData && isLoading)) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto max-w-4xl py-4 px-2 sm:px-4">
            <Card className="mb-6 bg-gradient-to-br from-primary to-purple-600 shadow-lg overflow-hidden">
                <CardHeader className="px-4 py-4 sm:px-6 sm:py-5">
                    <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                        <Wallet className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> My Wallet
                    </CardTitle>
                    <CardDescription className="text-white/80 text-xs sm:text-sm">
                        Your central place for all funds and transactions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-0.5 bg-white/10">
                   <WalletStatCard title="Deposit Balance" value={walletBalances.deposit} icon={Wallet} isLoading={isLoading} className="bg-primary/80 backdrop-blur-sm" />
                   <WalletStatCard title="Winning Balance" value={walletBalances.winning} icon={Trophy} isLoading={isLoading} className="bg-primary/80 backdrop-blur-sm" />
                   <WalletStatCard title="Bonus Balance" value={walletBalances.bonus} icon={PiggyBank} isLoading={isLoading} className="bg-primary/80 backdrop-blur-sm" />
                </CardContent>
            </Card>

             <Card className="mb-6">
                <CardHeader className="px-4 py-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                        <CardTitle className="mb-2 sm:mb-0">Actions</CardTitle>
                        <div className='text-left sm:text-right'>
                            <p className='text-xs sm:text-sm text-muted-foreground'>Total Balance</p>
                            {isLoading ? <Skeleton className="h-7 w-28 mt-1" /> : <p className="text-xl sm:text-2xl font-bold">₹{walletBalances.total.toFixed(2)}</p>}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 pb-4 sm:px-6 sm:pb-6">
                    <Button size="lg" className="h-14 text-base sm:h-16 sm:text-lg" onClick={() => router.push('/deposit')}>
                        <ArrowDownLeft className="mr-2 h-5 w-5 sm:h-6 sm:w-6"/> Deposit
                    </Button>
                    <Button size="lg" variant="outline" className="h-14 text-base sm:h-16 sm:text-lg" onClick={() => router.push('/withdraw')}>
                        <ArrowUpRight className="mr-2 h-5 w-5 sm:h-6 sm:w-6"/> Withdraw
                    </Button>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><History className="mr-2"/>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="space-y-4">
                           {[...Array(3)].map((_,i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                        </div>
                    )}
                    {!isLoading && transactions && transactions.length > 0 && (
                        <div className="space-y-2">
                            {transactions.map((tx: any) => (
                                <div key={tx.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 border-b last:border-b-0">
                                    <div className={`flex items-center justify-center h-10 w-10 rounded-full ${tx.type === 'credit' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                                        {tx.type === 'credit' ? <ArrowDownLeft className="h-5 w-5 text-green-600 dark:text-green-400"/> : <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400"/>}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold capitalize">{getReasonText(tx.reason)}</p>
                                            {getStatusBadge(tx.status)}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{formatDate(tx.timestamp)}</p>
                                    </div>
                                    <p className={`font-bold text-lg text-right ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.type === 'credit' ? '+' : '-'}
                                        {formatCurrency(tx.amount)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                     {!isLoading && (!transactions || transactions.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">No recent transactions.</p>
                     )}
                </CardContent>
                {transactions && transactions.length > 0 && (
                     <CardContent className="pt-0">
                        <Button variant="outline" className="w-full" onClick={() => router.push('/transactions')}>
                            View All Transactions
                        </Button>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
