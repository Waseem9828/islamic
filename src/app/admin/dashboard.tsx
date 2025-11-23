'use client';

import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase/provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, Users, Trophy, Hourglass, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardStats {
    totalCommission: number;
    totalWinnings: number;
    activeMatches: number;
    totalUsers: number;
    pendingDeposits: number;
    pendingWithdrawals: number;
}

const StatCard = ({ title, value, icon: Icon, note }: { title: string, value: string | number, icon: React.ElementType, note?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </CardContent>
    </Card>
);

export const AdminDashboard = () => {
    const { functions } = useFirebase();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!functions) return;

        const getStats = async () => {
            const getAdminDashboardStats = httpsCallable(functions, 'getAdminDashboardStats');
            try {
                const result = await getAdminDashboardStats();
                setStats(result.data as DashboardStats);
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Failed to load dashboard data.');
                toast.error('Dashboard Error', { description: err.message });
            } finally {
                setIsLoading(false);
            }
        };

        getStats();
    }, [functions]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-8">
                 <Card className="border-destructive">
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                         <AlertTriangle className="h-6 w-6 text-destructive mr-3" />
                        <CardTitle className="text-destructive">Failed to Load Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>There was an error fetching the dashboard statistics. Please try again later.</p>
                        <p className='text-xs text-muted-foreground mt-2'>{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!stats) {
        return <div className="p-8 text-center">No stats available.</div>;
    }

    return (
         <div className="container mx-auto py-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard 
                    title="Total Users" 
                    value={stats.totalUsers} 
                    icon={Users} 
                />
                <StatCard 
                    title="Active Matches" 
                    value={stats.activeMatches} 
                    icon={Trophy}
                />
                <StatCard 
                    title="Pending Deposits" 
                    value={stats.pendingDeposits} 
                    icon={Hourglass} 
                    note='Requires review'
                />
                 <StatCard 
                    title="Pending Withdrawals" 
                    value={stats.pendingWithdrawals} 
                    icon={Hourglass} 
                    note='Requires review'
                />
                <StatCard 
                    title="Total Commission Earned" 
                    value={`₹${stats.totalCommission.toFixed(2)}`} 
                    icon={IndianRupee} 
                />
                <StatCard 
                    title="Total Winnings Paid Out" 
                    value={`₹${stats.totalWinnings.toFixed(2)}`} 
                    icon={IndianRupee} 
                />
            </div>
        </div>
    );
};
