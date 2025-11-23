'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirebase } from '@/firebase';
import { collection, getDocs, query, orderBy, limit, where, documentId } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award } from 'lucide-react';

// Define interfaces for our data structures
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

// A component to display rank icons
const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
  if (rank === 3) return <Award className="h-6 w-6 text-yellow-600" />;
  return <span className="font-bold text-lg w-6 text-center text-muted-foreground">{rank}</span>;
};

// The main Leaderboard Page component
export default function LeaderboardPage() {
  const { firestore } = useFirebase();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const fetchLeaderboardData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch top 100 wallets sorted by winningBalance
        const walletsQuery = query(
          collection(firestore, 'wallets'), 
          orderBy('winningBalance', 'desc'), 
          limit(100)
        );
        const walletSnap = await getDocs(walletsQuery);
        const topWallets = walletSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wallet));
        const userIds = topWallets.map(w => w.id);

        if (userIds.length === 0) {
            setLeaderboard([]);
            return;
        }

        // 2. Fetch user data for the top players in batches (Firestore `in` query limit is 30)
        const usersData: { [key: string]: User } = {};
        for (let i = 0; i < userIds.length; i += 30) {
            const batchIds = userIds.slice(i, i + 30);
            const usersQuery = query(collection(firestore, 'users'), where(documentId(), 'in', batchIds));
            const userSnap = await getDocs(usersQuery);
            userSnap.docs.forEach(doc => {
                usersData[doc.id] = { id: doc.id, ...doc.data() } as User;
            });
        }

        // 3. Combine wallet and user data
        const combinedData: LeaderboardEntry[] = topWallets
          .map((wallet, index) => {
            const user = usersData[wallet.id];
            if (!user) return null; // Skip if user data not found
            return {
              ...user,
              rank: index + 1,
              winningBalance: wallet.winningBalance || 0,
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

    fetchLeaderboardData();
  }, [firestore]);

  // Skeleton loader component for better UX
  const LeaderboardSkeleton = () => (
    <div className="space-y-3 pt-4">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                <Skeleton className="h-6 w-6 rounded-md" />
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-6 w-1/4" />
            </div>
        ))}
    </div>
  );

  return (
    <div className="container mx-auto max-w-3xl py-6 sm:py-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center border-b pb-6">
          <Trophy className="w-14 h-14 mx-auto text-yellow-400" />
          <CardTitle className="text-3xl sm:text-4xl font-extrabold mt-2">Player Leaderboard</CardTitle>
          <CardDescription className="mt-2 text-base">Top 100 players ranked by total winnings.</CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          {isLoading ? (
            <LeaderboardSkeleton />
          ) : (
            leaderboard.length > 0 ? (
                <div className="flow-root">
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {leaderboard.map(player => (
                      <li key={player.id} className="flex items-center gap-4 p-3 sm:p-4 hover:bg-muted/50 transition-colors rounded-lg">
                        <RankIcon rank={player.rank} />
                        <Avatar className="h-12 w-12 border">
                            <AvatarImage src={player.photoURL || undefined} alt={player.displayName || 'User'} />
                            <AvatarFallback>{player.displayName?.[0] || player.email?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold truncate">{player.displayName || 'Anonymous User'}</p>
                            <p className="text-sm text-muted-foreground truncate">@{player.email || `user_${player.id.substring(0,6)}`}</p>
                        </div>
                        <p className="font-bold text-lg text-emerald-600 dark:text-emerald-500">₹{player.winningBalance.toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                </div>
            ) : (
              <p className="text-center py-12 text-muted-foreground">The leaderboard is currently empty.</p>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}