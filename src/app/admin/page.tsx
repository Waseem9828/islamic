'use client';

import { useEffect, useState } from 'react';
import { useFirebase, useUser } from "@/firebase";
import { httpsCallable } from 'firebase/functions';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { IndianRupee, Users, Swords, AlertTriangle, Hourglass, CheckCircle, PiggyBank, Scale, Ban } from 'lucide-react';
import Link from "next/link";
import { toast } from 'sonner';

interface DashboardStats {
    totalCommission: number;
    totalWinnings: number;
    pendingDeposits: number;
    pendingWithdrawals: number;
    activeMatches: number;
    totalUsers: number;
}

const AdminDashboard = () => {
    const { functions } = useFirebase();
    const { isAdmin, isUserLoading } = useUser();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!functions || !isAdmin) return;

        const fetchStats = async () => {
            setIsLoading(true);
            try {
                const getStats = httpsCallable(functions, 'getAdminDashboardStats');
                const response = await getStats();
                setStats(response.data as DashboardStats);
            } catch (error) {
                console.error("Error fetching admin stats:", error);
                toast.error("Dashboard Error", { description: "Could not load dashboard statistics." });
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [functions, isAdmin]);

    if (isUserLoading) {
        return <div className="p-4 text-center">Verifying access...</div>;
    }

    if (!isAdmin) {
        return (
             <div className="container mx-auto max-w-2xl py-8 text-center">
                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-center text-destructive">
                           <Ban className="mr-2" /> Access Denied
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>You do not have the necessary permissions to view this page. Please contact the system administrator if you believe this is an error.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Admin Dashboard</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <StatCard 
                    title="Total Commission Earned" 
                    value={`₹${stats?.totalCommission?.toLocaleString() || '0.00'}`} 
                    icon={<Scale />}
                    color="text-blue-500"
                />
                <StatCard 
                    title="Total Winnings Paid Out" 
                    value={`₹${stats?.totalWinnings?.toLocaleString() || '0.00'}`} 
                    icon={<PiggyBank />}
                    color="text-green-500"
                />
                <StatCard 
                    title="Total Users" 
                    value={stats?.totalUsers?.toLocaleString() || '0'} 
                    icon={<Users />}
                    color="text-purple-500"
                />
                <StatCard 
                    title="Active Matches" 
                    value={stats?.activeMatches?.toLocaleString() || '0'}
                    icon={<Swords />}
                    color="text-yellow-500"
                />
                 <Link href="/admin/deposits">
                    <StatCard 
                        title="Pending Deposits" 
                        value={stats?.pendingDeposits?.toLocaleString() || '0'} 
                        icon={<Hourglass />} 
                        color="text-orange-500" 
                        isLink={true}
                    />
                </Link>
                <Link href="/admin/withdrawals">
                    <StatCard 
                        title="Pending Withdrawals" 
                        value={stats?.pendingWithdrawals?.toLocaleString() || '0'} 
                        icon={<AlertTriangle />} 
                        color="text-red-500" 
                        isLink={true}
                    />
                </Link>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color, isLink=false }: { title: string, value: string, icon: React.ReactNode, color: string, isLink?: boolean }) => {
    return (
        <Card className={`shadow-md transition-all duration-300 ${isLink ? 'hover:shadow-lg hover:scale-105 cursor-pointer' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={`${color}`}>{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
};

const DashboardSkeleton = () => (
    <div className="container mx-auto py-8">
        <Skeleton className="h-10 w-3/5 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <Card key={i} className="shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <Skeleton className="h-4 w-3/5" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-2/5" />
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
);

export default AdminDashboard;
