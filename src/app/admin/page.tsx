
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Users, List, IndianRupee, Settings, ArrowLeft, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useDoc, useFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

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
    const { firestore } = useFirebase();

    // Data for Users Card
    const usersQuery = useMemo(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection(usersQuery);

    // Data for Deposit Requests Card
    const depositRequestsQuery = useMemo(() => firestore ? query(collection(firestore, 'depositRequests'), where('status', '==', 'pending')) : null, [firestore]);
    const { data: pendingDeposits, isLoading: isLoadingDeposits } = useCollection(depositRequestsQuery);
    
    // Data for Payment Settings Card
    const paymentSettingsDoc = useMemo(() => firestore ? doc(firestore, 'settings', 'payment') : null, [firestore]);
    const { data: paymentSettings, isLoading: isLoadingSettings } = useDoc(paymentSettingsDoc);
    

    const adminFeatures = [
        {
            title: 'Manage Users',
            description: 'Total registered users',
            icon: Users,
            path: '/admin/users',
            data: users,
            isLoading: isLoadingUsers,
            dataFormatter: (data: any) => data?.length ?? 0,
        },
        {
            title: 'Deposit Requests',
            description: 'Pending user deposits',
            icon: IndianRupee,
            path: '/admin/deposit-requests',
            data: pendingDeposits,
            isLoading: isLoadingDeposits,
            dataFormatter: (data: any) => data?.length ?? 0,
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
         <Card
            className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-300 active:scale-95 group sm:col-span-2 lg:col-span-1"
            onClick={() => {
                // Future page for withdrawal requests
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Withdrawal Requests</CardTitle>
                <ListChecks className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Pending withdrawal requests</p>
            </CardContent>
        </Card>
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
