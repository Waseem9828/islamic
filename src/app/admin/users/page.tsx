'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirebase } from '@/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, Wallet, PiggyBank, Trophy, Users, UserCheck, UserPlus, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isAdmin?: boolean;
  lastActive?: Timestamp;
  createdAt?: Timestamp;
}

interface Wallet {
  id: string;
  depositBalance: number;
  winningBalance: number;
  bonusBalance: number;
}

type UserWithWallet = User & { wallet?: Omit<Wallet, 'id'> };

const StatCard = ({ title, value, icon: Icon }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
);


export default function ManageUsersPage() {
  const { firestore } = useFirebase();
  const [users, setUsers] = useState<UserWithWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!firestore) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const usersQuery = query(collection(firestore, 'users'));
        const walletsQuery = query(collection(firestore, 'wallets'));
        
        const [userSnap, walletSnap] = await Promise.all([
          getDocs(usersQuery),
          getDocs(walletsQuery),
        ]);

        const usersData = userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        const walletsData = new Map(walletSnap.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as Wallet]));

        const combinedData: UserWithWallet[] = usersData.map(user => {
          const wallet = walletsData.get(user.id);
          return {
            ...user,
            wallet: wallet ? { 
                depositBalance: wallet.depositBalance || 0,
                winningBalance: wallet.winningBalance || 0,
                bonusBalance: wallet.bonusBalance || 0,
             } : undefined,
          };
        });
        
        setUsers(combinedData);
      } catch (error) {
        console.error("Error fetching users and wallets:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [firestore]);
  
  const filteredUsers = useMemo(() => {
    if (!search) return users;
    return users.filter(user => 
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        user.id.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalUsers = users.length;
    const newUsersToday = users.filter(u => u.createdAt && u.createdAt.toDate() >= today).length;
    const activeLast7Days = users.filter(u => u.lastActive && u.lastActive.toDate() >= sevenDaysAgo).length;

    return { totalUsers, newUsersToday, activeLast7Days };
  }, [users]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Total Users" value={stats.totalUsers} icon={Users} />
            <StatCard title="Active Users (7 days)" value={stats.activeLast7Days} icon={UserCheck} />
            <StatCard title="New Users (Today)" value={stats.newUsersToday} icon={UserPlus} />
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
          <CardDescription>View and manage all registered users and their wallet balances.</CardDescription>
            <div className="pt-2">
                <Input placeholder="Search by name, email, or UID..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[150px]" />
                                <Skeleton className="h-3 w-[100px]" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.length > 0 ? filteredUsers.map(user => (
                <div key={user.id} className="grid grid-cols-1 md:grid-cols-3 items-center p-4 rounded-lg border gap-4">
                  <div className="md:col-span-1 flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={user.photoURL || `https://avatar.vercel.sh/${user.email}.png`} alt={user.email || 'User'} />
                        <AvatarFallback>{user.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-semibold flex items-center">{user.displayName || user.email} {user.isAdmin && <Badge variant="destructive" className="ml-2 flex items-center gap-1"><ShieldCheck className="h-3 w-3"/>Admin</Badge>}</div>
                        <p className="text-sm text-muted-foreground font-mono">{user.id}</p>
                    </div>
                  </div>
                  <div className="md:col-span-2 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-muted rounded-md">
                        <p className="font-semibold text-muted-foreground flex items-center justify-center gap-1"><Wallet className='h-3 w-3'/> Deposit</p>
                        <p className="font-bold text-sm">₹{user.wallet?.depositBalance?.toFixed(2) || '0.00'}</p>
                    </div>
                     <div className="p-2 bg-muted rounded-md">
                        <p className="font-semibold text-muted-foreground flex items-center justify-center gap-1"><Trophy className='h-3 w-3'/> Winnings</p>
                        <p className="font-bold text-sm">₹{user.wallet?.winningBalance?.toFixed(2) || '0.00'}</p>
                    </div>
                     <div className="p-2 bg-muted rounded-md">
                        <p className="font-semibold text-muted-foreground flex items-center justify-center gap-1"><PiggyBank className='h-3 w-3'/> Bonus</p>
                        <p className="font-bold text-sm">₹{user.wallet?.bonusBalance?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </div>
              )) : <p className="text-center text-muted-foreground py-4">No users found.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
