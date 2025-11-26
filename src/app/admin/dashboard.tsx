
'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { BarChart, Card, Title, Text } from '@tremor/react';
import { DollarSign, Users, ShoppingCart, TrendingUp, AlertCircle, BarChart2, Briefcase, UserCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


// Define the structure for a single stat card
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => (
  <Card className="p-4 flex items-center" decoration="top" decorationColor={color as any || 'blue'}>
    <div className={`p-3 rounded-full bg-${color}-100 mr-4`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
    </div>
    <div>
      <Text>{title}</Text>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  </Card>
);

// Main dashboard component
export const AdminDashboard = () => {
  const { user } = useFirebase();
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const getData = async () => {
      setError(null);
      try {
        const token = await user.getIdToken();
        const response = await fetch('https://us-east1-studio-4431476254-c1156.cloudfunctions.net/getAdminDashboardStats', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.error || !result.stats || !result.chartData) {
            throw new Error(result.error || 'Failed to fetch dashboard data. The data format is incorrect.');
        }

        setStats(result.stats);
        setChartData(result.chartData);

      } catch (err: any) {
        console.error("Admin Dashboard Error:", err);
        setError(`Failed to load dashboard data. Reason: ${err.message || 'Network error'}.`);
      } finally {
        setLoading(false);
      }
    };
    
    getData(); // Initial fetch
    const interval = setInterval(getData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);

  }, [user]);

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

  return (
    <div className="p-4 space-y-6">
        <Title>Admin Dashboard</Title>
        <Text>Overview of platform activity and finances.</Text>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} color="blue" />
            <StatCard title="Active Matches" value={stats?.activeMatches ?? 0} icon={ShoppingCart} color="orange" />
            <StatCard title="Total Commission" value={`₹${(stats?.totalCommission ?? 0).toFixed(2)}`} icon={DollarSign} color="green" />
            <StatCard title="Pending Deposits" value={stats?.pendingDeposits ?? 0} icon={Briefcase} color="yellow" />
            <StatCard title="Pending Withdrawals" value={stats?.pendingWithdrawals ?? 0} icon={TrendingUp} color="red" />
            <StatCard title="Total Winnings Paid" value={`₹${(stats?.totalWinnings ?? 0).toFixed(2)}`} icon={UserCheck} color="indigo"/>
        </div>

        {/* Charts */}
        <Card>
            <Title>Recent Activity (Last 7 Days)</Title>
            <BarChart
                className="mt-6"
                data={chartData}
                index="date"
                categories={['New Users', 'Revenue']}
                colors={['blue', 'green']}
                yAxisWidth={48}
                valueFormatter={(number) => {
                    if (chartData.some(item => item.Revenue === number)) return `₹${number}`;
                    return `${number}`;
                }}
            />
        </Card>
    </div>
  );
};

// Skeleton loader component
const DashboardSkeleton = () => (
    <div className="p-4 space-y-6 animate-pulse">
        <div>
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-lg"></div>
    </div>
);

    