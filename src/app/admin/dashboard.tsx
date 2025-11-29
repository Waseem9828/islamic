
'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Gamepad2, AlertCircle, TrendingUp, HandCoins, UserCheck, UserX, UserPlus, Trophy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description, className }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 text-muted-foreground ${className}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const UserStatCard: React.FC<Omit<StatCardProps, 'description'>> = ({ title, value, icon: Icon, className }) => (
    <div className="bg-muted/50 p-3 rounded-lg flex items-center gap-3">
        <Icon className={`h-6 w-6 ${className}`} />
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xl font-bold">{value}</p>
        </div>
    </div>
)


export const AdminDashboard = () => {
  const { functions } = useFirebase();
  const [data, setData] = useState<{ stats: any, chartData: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!functions) return;

    setLoading(true);
    const getStats = httpsCallable(functions, 'getAdminDashboardStats');

    getStats()
      .then((result: any) => {
        setData(result.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not load dashboard data. " + err.message);
        setLoading(false);
      });

  }, [functions]);

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
        <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }
  
  const formatCurrency = (value: number) => `₹${(value || 0).toFixed(2)}`;
  const stats = data?.stats;
  const chartData = data?.chartData || [];

  return (
    <div className="space-y-4">
       <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Users className="mr-2"/>User Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <UserStatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} />
                <UserStatCard title="Active" value={stats?.activeUsers ?? 0} icon={UserCheck} className="text-green-500" />
                <UserStatCard title="Suspended" value={stats?.suspendedUsers ?? 0} icon={UserX} className="text-red-500"/>
                <UserStatCard title="New Today" value={`+${stats?.newToday ?? 0}`} icon={UserPlus} className="text-blue-500"/>
            </CardContent>
        </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Matches" value={stats?.activeMatches ?? 0} icon={Gamepad2} description="In-progress or waiting" />
        <StatCard title="Completed Matches" value={stats?.completedMatches ?? 0} icon={Trophy} description="Finished matches total" />
        <StatCard title="Pending Deposits" value={stats?.pendingDeposits ?? 0} icon={TrendingUp} description="Requests needing approval" />
        <StatCard title="Pending Withdrawals" value={stats?.pendingWithdrawals ?? 0} icon={HandCoins} description="Requests needing approval" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
         <StatCard title="Total Commission" value={formatCurrency(stats?.totalCommission ?? 0)} icon={DollarSign} description="Total revenue from matches" />
         <StatCard title="Total Winnings Paid" value={formatCurrency(stats?.totalWinnings ?? 0)} icon={HandCoins} description="Total amount paid to winners" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Growth & Revenue (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        border: "1px solid hsl(var(--border))" 
                      }}
                      formatter={(value: number, name: string) => [name === 'Revenue' ? formatCurrency(value) : value, name]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="New Users" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

const DashboardSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-40" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[108px]" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[108px]" />
            <Skeleton className="h-[108px]" />
        </div>
        <Card>
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent><Skeleton className="h-[350px]" /></CardContent>
        </Card>
    </div>
);
