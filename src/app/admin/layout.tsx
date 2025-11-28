
'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFirebase } from '@/firebase/provider';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

interface NotificationCounts {
    deposits: number;
    withdrawals: number;
}

const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying credentials...</p>
    </div>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isAdmin, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const router = useRouter();
    const [counts, setCounts] = useState<NotificationCounts>({ deposits: 0, withdrawals: 0 });

    useEffect(() => {
        if (isUserLoading) return;
        if (!user || !isAdmin) {
            router.replace('/login');
        }
    }, [user, isAdmin, isUserLoading, router]);

    useEffect(() => {
        if (isAdmin && firestore) {
            const depositsQuery = query(collection(firestore, 'depositRequests'), where('status', '==', 'pending'));
            const unsubDeposits = onSnapshot(depositsQuery, (snapshot) => {
                setCounts(prev => ({ ...prev, deposits: snapshot.size }));
            }, (error) => {
                console.error("Could not fetch deposit counts:", error);
            });

            const withdrawalsQuery = query(collection(firestore, 'withdrawalRequests'), where('status', '==', 'pending'));
            const unsubWithdrawals = onSnapshot(withdrawalsQuery, (snapshot) => {
                setCounts(prev => ({ ...prev, withdrawals: snapshot.size }));
            }, (error) => {
                console.error("Could not fetch withdrawal counts:", error);
            });

            return () => {
                unsubDeposits();
                unsubWithdrawals();
            };
        }
    }, [isAdmin, firestore]);

    if (isUserLoading || !isAdmin) {
        return <LoadingScreen />;
    }

    return (
       <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <AdminSidebar notificationCounts={counts} />
          <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
              {children}
            </main>
          </div>
        </div>
    );
}
