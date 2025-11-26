
'use client';

import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase/provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IndianRupee, Users, Trophy, Hourglass, Loader2, AlertTriangle, Gamepad2, BarChart, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface DashboardStats {
    totalCommission: number;
    totalWinnings: number;
    activeMatches: number;
    totalUsers: number;
    pendingDeposits: number;
    pendingWithdrawals: number;
}

interface ChartData {
    signups: { date: string; count: number }[];
    matches: { date: string; count: number }[];
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

const chartConfig = {
    count: {
      label: "Count",
      color: "hsl(var(--primary))",
    },
} satisfies ChartConfig

export const AdminDashboard = () => {
    const { functions } = useFirebase();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!functions) return;

        const getData = async () => {
            setIsLoading(true);
            setError(null);
            const getAdminDashboardStats = httpsCallable(functions, 'getAdminDashboardStats');
            const getAdminChartData = httpsCallable(functions, 'getAdminChartData');
            
            try {
                const [statsResult, chartResult] = await Promise.all([
                    getAdminDashboardStats(),
                    getAdminChartData()
                ]);

                setStats(statsResult.data as DashboardStats);
                setChartData(chartResult.data as ChartData);
            } catch (err: any) {
                console.error(err);
                const errorMessage = err.message || 'Failed to load dashboard data.';
                setError(errorMessage);
                toast.error('Dashboard Error', { description: errorMessage });
            } finally {
                setIsLoading(false);
            }
        };

        getData();
    }, [functions]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                    {[...Array(4)].map(i => (
                        <Card key={i}><CardHeader><Loader2 className="h-6 w-6 animate-spin" /></CardHeader></Card>
                    ))}
                </div>
                 <div className="grid gap-4 md:grid-cols-2">
                    <Card><CardHeader><CardTitle>Recent Signups</CardTitle></CardHeader><CardContent><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
                    <Card><CardHeader><CardTitle>Match Volume</CardTitle></CardHeader><CardContent><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
                </div>
            </div>
        );
    }

    if (error) {
        return (
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
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} />
                <StatCard title="Active Matches" value={stats?.activeMatches || 0} icon={Gamepad2} />
                <StatCard title="Pending Deposits" value={stats?.pendingDeposits || 0} icon={Hourglass} note='Requires review' />
                <StatCard title="Pending Withdrawals" value={stats?.pendingWithdrawals || 0} icon={Hourglass} note='Requires review' />
                <StatCard title="Total Commission" value={`₹${(stats?.totalCommission || 0).toFixed(2)}`} icon={IndianRupee} />
                <StatCard title="Total Winnings Paid" value={`₹${(stats?.totalWinnings || 0).toFixed(2)}`} icon={Trophy} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><BarChart className="mr-2 h-5 w-5"/>Recent Signups</CardTitle>
                        <CardDescription>New users in the last 7 days.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[200px] w-full">
                            <AreaChart data={chartData?.signups} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(5)} />
                                 <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Area dataKey="count" type="monotone" fill="hsl(var(--primary))" fillOpacity={0.4} stroke="hsl(var(--primary))" />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5"/>Match Volume</CardTitle>
                        <CardDescription>Matches created in the last 7 days.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[200px] w-full">
                            <AreaChart data={chartData?.matches} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(5)} />
                                <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                                <Tooltip content={<ChartTooltipContent />} />
                                <Area dataKey="count" type="monotone" fill="hsl(var(--primary))" fillOpacity={0.4} stroke="hsl(var(--primary))" />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
