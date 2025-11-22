'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirebase } from '@/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award } from 'lucide-react';

interface User {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

interface Wallet {
  id: string;
  winningBalance: number;
}

type LeaderboardEntry = User & {
  rank: number;
  winningBalance: number;
};

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-slate-400" />;
  if (rank === 3) return <Award className="h-6 w-6 text-amber-700" />;
  return <span className="font-bold text-lg w-6 text-center">{rank}</span>;
};

export default function LeaderboardPage() {
  const { firestore } = useFirebase();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const usersQuery = query(collection(firestore, 'users'));
        const walletsQuery = query(collection(firestore, 'wallets'), orderBy('winningBalance', 'desc'));
        
        const [userSnap, walletSnap] = await Promise.all([
          getDocs(usersQuery),
          getDocs(walletsQuery),
        ]);

        const usersData = new Map(userSnap.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as User]));
        const walletsData = walletSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wallet));

        const combinedData: LeaderboardEntry[] = walletsData
          .map((wallet, index) => {
            const user = usersData.get(wallet.id);
            if (!user) return null;
            return {
              ...user,
              rank: index + 1,
              winningBalance: wallet.winningBalance,
            };
          })
          .filter((entry): entry is LeaderboardEntry => entry !== null);
        
        setLeaderboard(combinedData);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [firestore]);

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader className="text-center">
          <Trophy className="w-12 h-12 mx-auto text-yellow-400" />
          <CardTitle className="text-3xl font-bold mt-2">Leaderboard</CardTitle>
          <CardDescription>Top players ranked by their total winnings.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3">
                        <Skeleton className="h-6 w-6" />
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                        <Skeleton className="h-6 w-1/4" />
                    </div>
                ))}
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map(player => (
                <div key={player.id} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted transition-colors">
                  <RankIcon rank={player.rank} />
                  <Avatar className="h-12 w-12">
                      <AvatarImage src={player.photoURL || `https://avatar.vercel.sh/${player.email}.png`} alt={player.displayName || 'User'} />
                      <AvatarFallback>{player.displayName?.[0].toUpperCase() || player.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                      <p className="font-semibold">{player.displayName || player.email}</p>
                      <p className="text-xs text-muted-foreground font-mono">@{player.id.substring(0,8)}</p>
                  </div>
                  <p className="font-bold text-lg text-green-600">₹{player.winningBalance.toFixed(2)}</p>
                </div>
              ))}
              {leaderboard.length === 0 && <p className="text-center py-8 text-muted-foreground">No players on the leaderboard yet.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}