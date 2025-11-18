
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Users, List, IndianRupee, Settings, ArrowLeft, ListChecks, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useFirebase } from '@/firebase/provider';
import { collection, doc, query, where, onSnapshot } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Custom hook for a single document snapshot
const useDocument = (path: string | null) => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { firestore } = useFirebase();

    useEffect(() => {
        if (!firestore || !path) {
            setIsLoading(false);
            return;
        }
        const docRef = doc(firestore, path);
        const unsubscribe = onSnapshot(docRef, (doc) => {
            setData(doc.exists() ? doc.data() : null);
            setIsLoading(false);
        }, () => setIsLoading(false));
        return () => unsubscribe();
    }, [firestore, path]);

    return { data, isLoading };
};

// Custom hook for collection snapshots
const useCollectionData = (collectionName: string | null, queryString: any[] = []) => {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { firestore } = useFirebase();

    const queryMemo = useMemo(() => {
        if (!firestore || !collectionName) return null;
        let q = query(collection(firestore, collectionName));
        queryString.forEach(condition => {
            q = query(q, where(condition[0], condition[1], condition[2]));
        });
        return q;
    }, [firestore, collectionName, queryString]);

    useEffect(() => {
        if (!queryMemo) {
            setIsLoading(false);
            return;
        }
        const unsubscribe = onSnapshot(queryMemo, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setData(items);
            setIsLoading(false);
        }, () => setIsLoading(false));

        return () => unsubscribe();
    }, [queryMemo]);

    return { data, isLoading };
};


const StatCard = ({ title, description, icon: Icon, path, data, isLoading, dataFormatter }: {
    title: string;
    description: string;
    icon: React.ElementType;
    path: string;
    data: any;
    isLoading: boolean;
    dataFormatter: (data: any) => React.ReactNode;
}) => {
    const router = useRouter();
    return (
        <Card
            className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-300 active:scale-95 group"
            onClick={() => router.push(path)}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-6 w-1/3" />
                ) : (
                    <div className="text-2xl font-bold">{dataFormatter(data)}</div>
                )}
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}

export default function AdminDashboardPage() {
    const { data: users, isLoading: isLoadingUsers } = useCollectionData('users');
    const { data: pendingDeposits, isLoading: isLoadingDeposits } = useCollectionData('depositRequests', [['status', '==', 'pending']]);
    const { data: pendingWithdrawals, isLoading: isLoadingWithdrawals } = useCollectionData('withdrawalRequests', [['status', '==', 'pending']]);
    const { data: activeMatches, isLoading: isLoadingMatches } = useCollectionData('matches', [['status', 'in', ['waiting', 'inprogress']]]);
    const { data: paymentSettings, isLoading: isLoadingSettings } = useDocument('settings/payment');

    const adminFeatures = [
        {
            title: 'Manage Users',
            description: 'Total registered users',
            icon: Users,
            path: '/admin/users',
            data: users,
            isLoading: isLoadingUsers,
            dataFormatter: (data: any[]) => data.length ?? 0,
        },
        {
            title: 'Manage Matches',
            description: 'Active and waiting matches',
            icon: Trophy,
            path: '/admin/matches',
            data: activeMatches,
            isLoading: isLoadingMatches,
            dataFormatter: (data: any[]) => data.length ?? 0,
        },
        {
            title: 'Deposit Requests',
            description: 'Pending user deposits',
            icon: IndianRupee,
            path: '/admin/deposit-requests',
            data: pendingDeposits,
            isLoading: isLoadingDeposits,
            dataFormatter: (data: any[]) => data.length ?? 0,
        },
        {
            title: 'Withdrawal Requests',
            description: 'Pending user withdrawals',
            icon: ListChecks,
            path: '/admin/withdrawals',
            data: pendingWithdrawals,
            isLoading: isLoadingWithdrawals,
            dataFormatter: (data: any[]) => data.length ?? 0,
        },
        {
            title: 'Payment Settings',
            description: 'Your configured UPI ID',
            icon: Settings,
            path: '/admin/payment-settings',
            data: paymentSettings,
            isLoading: isLoadingSettings,
            dataFormatter: (data: any) => data?.upiId ? <span className='text-base truncate'>{data.upiId}</span> : <span className="text-base text-destructive">Not Set</span>,
        },
    ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome! Here's a quick overview of your application.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {adminFeatures.map((feature) => (
          <StatCard
            key={feature.title}
            {...feature}
          />
        ))}
      </div>

       <Card className="mt-8">
          <CardHeader>
            <CardTitle>Go Back</CardTitle>
            <CardDescription>
              Return to the main application view.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/" passHref>
                <button className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                    <ArrowLeft className="h-4 w-4" />
                    Back to App
                </button>
            </Link>
          </CardContent>
        </Card>
    </div>
  );
}
