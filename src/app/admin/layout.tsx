'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase/provider';

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
    const { functions } = useFirebase();
    const router = useRouter();
    const [counts, setCounts] = useState<NotificationCounts>({ deposits: 0, withdrawals: 0 });

    useEffect(() => {
        if (isUserLoading) return;
        if (!user || !isAdmin) {
            router.replace('/login');
        }
    }, [user, isAdmin, isUserLoading, router]);

    useEffect(() => {
        if (isAdmin && functions) {
            const getStats = async () => {
                const getAdminDashboardStats = httpsCallable(functions, 'getAdminDashboardStats');
                try {
                    const result = await getAdminDashboardStats();
                    const data = result.data as { pendingDeposits: number; pendingWithdrawals: number; };
                    setCounts({
                        deposits: data.pendingDeposits || 0,
                        withdrawals: data.pendingWithdrawals || 0,
                    });
                } catch (err) {
                    console.error("Could not fetch notification counts:", err);
                }
            };
            
            getStats();
            const interval = setInterval(getStats, 30000); // Refresh every 30 seconds
            return () => clearInterval(interval);
        }
    }, [isAdmin, functions]);

    if (isUserLoading || !isAdmin) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-muted/40">
            <AdminSidebar notificationCounts={counts} />
            <div className="md:pl-20 transition-all duration-300 ease-in-out">
                <main>
                    {children}
                </main>
            </div>
        </div>
    );
}
