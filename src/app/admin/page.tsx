
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Users, ListChecks, IndianRupee, Banknote, Activity, Trophy, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useFirebase } from '@/firebase/provider';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const useCollectionCount = (collectionName: string | null, queryString: any[] = []) => {
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const { firestore } = useFirebase();

    const queryMemo = useMemo(() => {
        if (!firestore || !collectionName) return null;
        let q = query(collection(firestore, collectionName));
        queryString.forEach(condition => {
            q = query(q, where(condition[0], condition[1], condition[2]));
        });
        return q;
    }, [firestore, collectionName, JSON.stringify(queryString)]);

    useEffect(() => {
        if (!queryMemo) {
            setIsLoading(false);
            return;
        }
        const unsubscribe = onSnapshot(queryMemo, (snapshot) => {
            setCount(snapshot.size);
            setIsLoading(false);
        }, () => setIsLoading(false));

        return () => unsubscribe();
    }, [queryMemo]);

    return { count, isLoading };
};

const useCollectionData = (collectionName: string | null, order: [string, "desc" | "asc"] | null = null, lim: number | null = null) => {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { firestore } = useFirebase();

    const queryMemo = useMemo(() => {
        if (!firestore || !collectionName) return null;
        let q = query(collection(firestore, collectionName));
        if (order) {
            q = query(q, orderBy(order[0], order[1]));
        }
        if (lim) {
            q = query(q, limit(lim))
        }
        return q;
    }, [firestore, collectionName, order, lim]);

    useEffect(() => {
        if (!queryMemo) {
            setIsLoading(false);
            return;
        }
        const unsubscribe = onSnapshot(queryMemo, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setData(items);
            setIsLoading(false);
        }, () => setIsLoading(false));

        return () => unsubscribe();
    }, [queryMemo]);
    
    return { data, isLoading };
}


const StatCard = ({ title, value, icon: Icon, path, isLoading, description, className }: {
    title: string;
    value: React.ReactNode;
    icon: React.ElementType;
    path: string;
    isLoading: boolean;
    description: string;
    className?: string;
}) => {
    const router = useRouter();
    return (
        <Card
            className={cn("cursor-pointer hover:shadow-lg transition-shadow", className)}
            onClick={() => router.push(path)}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-1/3 mt-1" /> : <div className="text-2xl font-bold">{value}</div>}
                 <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}

export default function AdminDashboardPage() {
    const { count: userCount, isLoading: isLoadingUsers } = useCollectionCount('users');
    const { count: pendingDeposits, isLoading: isLoadingDeposits } = useCollectionCount('depositRequests', [['status', '==', 'pending']]);
    const { count: pendingWithdrawals, isLoading: isLoadingWithdrawals } = useCollectionCount('withdrawalRequests', [['status', '==', 'pending']]);
    const { count: activeMatches, isLoading: isLoadingMatches } = useCollectionCount('matches', [['status', 'in', ['waiting', 'inprogress']]]);
    const { data: transactions, isLoading: isLoadingTransactions } = useCollectionData('transactions', ['timestamp', 'desc'], 15);
    
    const chartData = useMemo(() => {
        if (!transactions) return [];
        return transactions
            .map(tx => ({ ...tx, date: tx.timestamp?.toDate() }))
            .sort((a,b) => a.date - b.date)
            .map(tx => ({
                date: format(tx.date, 'MMM d'),
                credit: tx.type === 'credit' ? tx.amount : 0,
                debit: tx.type === 'debit' ? tx.amount : 0
            }));
    }, [transactions]);
    
    const chartConfig = {
      credit: { label: "Credit", color: "hsl(var(--chart-2))" },
      debit: { label: "Debit", color: "hsl(var(--chart-5))" },
    };


    return (
    <div className="p-4 sm:p-6 lg:p-8 bg-muted/20 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">An overview of your Ludo application.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={userCount} icon={Users} path="/admin/users" isLoading={isLoadingUsers} description="All registered users" className="border-primary/20" />
        <StatCard title="Active Matches" value={activeMatches} icon={Trophy} path="/admin/matches" isLoading={isLoadingMatches} description="Matches currently in play" className="border-orange-500/20" />
        <StatCard title="Pending Deposits" value={pendingDeposits} icon={Banknote} path="/admin/deposit-requests" isLoading={isLoadingDeposits} description="Needs admin approval" className="border-green-500/20" />
        <StatCard title="Pending Withdrawals" value={pendingWithdrawals} icon={ListChecks} path="/admin/withdrawals" isLoading={isLoadingWithdrawals} description="Needs admin approval" className="border-yellow-500/20" />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center"><Activity className="mr-2"/>Recent Transaction Volume</CardTitle>
                    <CardDescription>Credits vs. Debits from the last 15 transactions.</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                    {isLoadingTransactions ? <Skeleton className="h-full w-full"/> : (
                         <ChartContainer config={chartConfig} className='h-full w-full'>
                            <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0, 3)} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                                <Area dataKey="credit" type="natural" fill="var(--color-credit)" fillOpacity={0.4} stroke="var(--color-credit)" stackId="a" />
                                <Area dataKey="debit" type="natural" fill="var(--color-debit)" fillOpacity={0.4} stroke="var(--color-debit)" stackId="a" />
                            </AreaChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><ShieldAlert className="mr-2" />Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <Link href="/admin/deposit-requests" passHref><Button className="w-full justify-start">Manage Deposits <Badge className="ml-auto">{pendingDeposits}</Badge></Button></Link>
                    <Link href="/admin/withdrawals" passHref><Button className="w-full justify-start">Manage Withdrawals <Badge className="ml-auto">{pendingWithdrawals}</Badge></Button></Link>
                    <Link href="/admin/matches" passHref><Button className="w-full justify-start">Manage Matches <Badge className="ml-auto">{activeMatches}</Badge></Button></Link>
                    <Link href="/admin/settings" passHref><Button variant="secondary" className="w-full justify-start">App Rules</Button></Link>
                    <Link href="/admin/payment-settings" passHref><Button variant="secondary" className="w-full justify-start">Payment Settings</Button></Link>
                </CardContent>
            </Card>
       </div>
    </div>
    );
}
