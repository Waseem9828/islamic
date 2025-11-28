
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase } from '@/firebase';
import { collection, doc, query, where, orderBy, limit, onSnapshot, DocumentData, Timestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownLeft, ArrowUpRight, Wallet, PiggyBank, Trophy, History } from 'lucide-react';
import { format } from 'date-fns';

// Main component for the Wallet Page
export default function WalletPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [wallet, setWallet] = useState<DocumentData | null>(null);
  const [transactions, setTransactions] = useState<DocumentData[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoading || !firestore) {
        setIsDataLoading(true);
        return;
    }
    if (!user) {
        setIsDataLoading(false);
        return;
    }

    const walletDocRef = doc(firestore, 'wallets', user.uid);
    const unsubscribeWallet = onSnapshot(walletDocRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setWallet(docSnap.data());
        } else {
          setWallet({ depositBalance: 0, winningBalance: 0, bonusBalance: 0 });
        }
        setIsDataLoading(false);
      },
      (err) => {
        console.error("Error fetching wallet:", err);
        setError("Failed to load wallet information.");
        setIsDataLoading(false);
      }
    );

    const transactionsQuery = query(
      collection(firestore, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const unsubscribeTransactions = onSnapshot(transactionsQuery, 
      (querySnapshot) => {
        const trans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(trans);
      },
      (err) => {
        console.error("Error fetching transactions:", err);
        setError("Could not load recent transactions. Please check browser console for Firestore indexing errors.");
      }
    );

    return () => {
      unsubscribeWallet();
      unsubscribeTransactions();
    };
  }, [user, isUserLoading, firestore]);

  const totalBalance = useMemo(() => {
    if (!wallet) return 0;
    return (wallet.depositBalance || 0) + (wallet.winningBalance || 0) + (wallet.bonusBalance || 0);
  }, [wallet]);

  if (isUserLoading || isDataLoading) {
    return <WalletSkeleton />;
  }

  if (!user) {
      return (
        <div className="container mx-auto p-4 text-center">
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>You must be logged in to view your wallet.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/login')}>Go to Login</Button>
                </CardContent>
            </Card>
        </div>
      )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BalanceCard title="Total Balance" amount={totalBalance} icon={Wallet} />
        <BalanceCard title="Deposit Balance" amount={wallet?.depositBalance} icon={PiggyBank} />
        <BalanceCard title="Winning Balance" amount={wallet?.winningBalance} icon={Trophy} />
        <BalanceCard title="Bonus Balance" amount={wallet?.bonusBalance} icon={PiggyBank} className="text-purple-600"/>
      </div>
      
      <div className="flex space-x-4">
        <Button size="lg" className="flex-1" onClick={() => router.push('/deposit')}>Deposit</Button>
        <Button size="lg" variant="secondary" className="flex-1" onClick={() => router.push('/withdraw')}>Withdraw</Button>
      </div>
      {error && <p className="text-center text-red-500">{error}</p>}
      <RecentTransactions transactions={transactions} />

      <Button onClick={() => router.push('/transactions')} variant="outline" className="w-full">
        <History className="mr-2 h-4 w-4"/>
        View All Transactions
      </Button>
    </div>
  );
}

function BalanceCard({ title, amount, icon: Icon, className }: { title: string, amount: number, icon: React.ElementType, className?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 text-muted-foreground ${className}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">₹{amount?.toFixed(2) ?? '0.00'}</div>
      </CardContent>
    </Card>
  );
}

function RecentTransactions({ transactions }: { transactions: DocumentData[] }) {
  const isValidTimestamp = (timestamp: any): timestamp is Timestamp => {
      return timestamp && typeof timestamp.toDate === 'function';
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent transactions found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your last 20 transactions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center">
              <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 mr-4">
                {tx.type === 'deposit' || tx.type === 'credit' ? (
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ArrowDownLeft className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="flex-grow">
                <p className="font-semibold capitalize">{tx.description || tx.type}</p>
                <p className="text-sm text-muted-foreground">
                  {isValidTimestamp(tx.timestamp) ? format(tx.timestamp.toDate(), 'PPpp') : 'Date not available'}
                </p>
              </div>
              <div className={`font-bold ${tx.type === 'deposit' || tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                {tx.type === 'deposit' || tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WalletSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex space-x-4">
        <Skeleton className="h-12 flex-1" />
        <Skeleton className="h-12 flex-1" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-full mr-4" />
                <div className="flex-grow space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
