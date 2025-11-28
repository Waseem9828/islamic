
'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase/provider';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, PanelLeft } from 'lucide-react';

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
                    const data = result.data as { stats?: { pendingDeposits: number; pendingWithdrawals: number; } };
                    // Safeguard against malformed data
                    if (data && data.stats) {
                        setCounts({
                            deposits: data.stats.pendingDeposits || 0,
                            withdrawals: data.stats.pendingWithdrawals || 0,
                        });
                    }
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

    