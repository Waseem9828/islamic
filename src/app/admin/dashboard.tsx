
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase/provider';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Gamepad2, AlertCircle, TrendingUp, HandCoins } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';

// Define the structure for a single stat card
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, description }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

// Main dashboard component
export const AdminDashboard = () => {
  const { user } = useUser();
  const { functions } = useFirebase();
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !functions) return;
    
    const getData = async () => {
      setError(null);
      try {
        const getAdminDashboardStats = httpsCallable(functions, 'getAdminDashboardStats');
        const result = await getAdminDashboardStats();
        
        const data = result.data as any;

        if (!data || data.error || !data.stats || !data.chartData) {
            throw new Error(data.error || 'Failed to fetch dashboard data. The data format is incorrect.');
        }
        
        setStats(data.stats);
        setChartData(data.chartData);

      } catch (err: any) {
        console.error("Admin Dashboard Error:", err);
        setError(`Failed to load dashboard data. Reason: ${err.message || 'Network error'}.`);
      } finally {
        setLoading(false);
      }
    };
    
    getData(); // Initial fetch
    const interval = setInterval(getData, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);

  }, [user, functions]);

  if (loading) {
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
  
  const formatCurrency = (value: number) => `₹${value.toFixed(2)}`;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} description="All registered users" />
        <StatCard title="Active Matches" value={stats?.activeMatches ?? 0} icon={Gamepad2} description="Matches currently in progress or waiting" />
        <StatCard title="Total Commission" value={formatCurrency(stats?.totalCommission ?? 0)} icon={DollarSign} description="Total revenue generated from matches" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Pending Deposits" value={stats?.pendingDeposits ?? 0} icon={TrendingUp} description="Deposit requests needing approval" />
        <StatCard title="Pending Withdrawals" value={stats?.pendingWithdrawals ?? 0} icon={TrendingUp} description="Withdrawal requests needing approval" />
        <StatCard title="Total Winnings Paid" value={formatCurrency(stats?.totalWinnings ?? 0)} icon={HandCoins} description="Total amount paid out to winners" />
      </div>

      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        border: "1px solid hsl(var(--border))" 
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="New Users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="Revenue" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

// Skeleton loader component
const DashboardSkeleton = () => (
    <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[126px]" />)}
        </div>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[126px]" />)}
        </div>
        <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-[350px]" /></CardContent>
        </Card>
    </div>
);
