
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirebase, useUser } from '@/firebase';
import { collection, getDocs, query, orderBy, limit, where, documentId, onSnapshot } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Crown, Share2 } from 'lucide-react';
import { LoadingScreen } from '@/components/ui/loading';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// --- Type Definitions ---
interface User {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string; // This was missing
}

interface Wallet {
  id: string;
  winningBalance: number;
}

type LeaderboardEntry = User & {
  rank: number;
  winningBalance: number;
};

// --- Helper Components ---

const TopPlayerCard = ({ player, rank }: { player: LeaderboardEntry; rank: number }) => {
  const rankStyles = {
    1: { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/50' },
    2: { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/50' },
    3: { icon: Award, color: 'text-amber-600', bg: 'bg-amber-600/10', border: 'border-amber-600/50' },
  };
  const { icon: Icon, color, bg, border } = rankStyles[rank as keyof typeof rankStyles];

  return (
    <Card className={cn('relative overflow-hidden shadow-lg border-2', bg, border)}>
        <div className="absolute top-0 right-0 p-2">
            <Icon className={cn('h-8 w-8 opacity-50', color)} />
        </div>
      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
        <Avatar className="w-20 h-20 border-4 border-background mb-3">
          <AvatarImage src={player.photoURL || undefined} alt={player.displayName || 'User'} />
          <AvatarFallback>{player.displayName?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <p className="font-bold text-lg truncate w-full">{player.displayName || 'Anonymous'}</p>
        <p className="text-sm text-muted-foreground truncate w-full">₹{player.winningBalance.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
};


// --- Main Leaderboard Component ---
export default function LeaderboardPage() {
  const { firestore } = useFirebase();
  const { user: currentUser } = useUser();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const walletsQuery = query(
      collection(firestore, 'wallets'), 
      orderBy('winningBalance', 'desc'), 
      limit(100)
    );

    const unsubscribe = onSnapshot(walletsQuery, async (walletSnap) => {
      setIsLoading(true);
      const topWallets = walletSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wallet));
      const userIds = topWallets.map(w => w.id).filter(id => id);

      if (userIds.length === 0) {
        setLeaderboard([]);
        setIsLoading(false);
        return;
      }
      
      const usersData: { [key: string]: User } = {};
      const userPromises = [];
      for (let i = 0; i < userIds.length; i += 30) {
        const batchIds = userIds.slice(i, i + 30);
        if (batchIds.length > 0) {
          const usersQuery = query(collection(firestore, 'users'), where(documentId(), 'in', batchIds));
          userPromises.push(getDocs(usersQuery));
        }
      }

      try {
        const userSnaps = await Promise.all(userPromises);
        userSnaps.forEach(snap => {
            snap.docs.forEach(doc => {
                usersData[doc.id] = { id: doc.id, ...doc.data() } as User;
            });
        });

        const combinedData: LeaderboardEntry[] = topWallets
          .map((wallet, index) => {
            const user = usersData[wallet.id];
            if (!user) return null;
            return {
              ...user,
              rank: index + 1,
              winningBalance: wallet.winningBalance || 0,
            };
          })
          .filter((entry): entry is LeaderboardEntry => entry !== null);
        
        setLeaderboard(combinedData);
      } catch (error) {
        console.error("Error fetching user data for leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      console.error("Error fetching leaderboard data:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);
  
  const handleShare = (rank: number, winnings: number) => {
    const shareText = `I'm rank #${rank} on Ludo Arena with ₹${winnings.toLocaleString()} in winnings! Come challenge me.`;
    const shareUrl = window.location.origin;

    if (navigator.share) {
      navigator.share({
        title: 'My Ludo Arena Rank!',
        text: shareText,
        url: shareUrl,
      })
      .then(() => toast.success('Rank shared successfully!'))
      .catch((error) => console.log('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast.info('Share feature not available. Rank info copied to clipboard!');
    }
  };

  const topThree = leaderboard.slice(0, 3);
  const others = leaderboard.slice(3);
  const currentUserRank = currentUser ? leaderboard.find(p => p.id === currentUser.uid) : null;


  return (
    <div className="container mx-auto max-w-4xl py-6 sm:py-8">
      <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Global Leaderboard</h1>
          <p className="mt-2 text-lg text-muted-foreground">See how you rank against the top players worldwide.</p>
      </div>

      {isLoading ? (
        <LoadingScreen text="Fetching Leaderboard..." />
      ) : leaderboard.length > 0 ? (
        <div className="space-y-12">
            {topThree.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 items-end">
                  {topThree[1] && <div className="order-2 md:order-1"><TopPlayerCard player={topThree[1]} rank={2} /></div>}
                  {topThree[0] && <div className="order-1 md:order-2"><TopPlayerCard player={topThree[0]} rank={1} /></div>}
                  {topThree[2] && <div className="order-3 md:order-3"><TopPlayerCard player={topThree[2]} rank={3} /></div>}
              </div>
            )}

            {currentUserRank && (
                <Card className="bg-primary/10 border-primary/50 border-2 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-lg">Your Rank</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <p className="text-2xl font-bold w-12 text-center">#{currentUserRank.rank}</p>
                            <Avatar className="h-12 w-12 border">
                                <AvatarImage src={currentUserRank.photoURL || undefined} alt={currentUserRank.displayName || 'U'} />
                                <AvatarFallback>{currentUserRank.displayName?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{currentUserRank.displayName}</p>
                                <p className="text-emerald-600 dark:text-emerald-500 font-bold">₹{currentUserRank.winningBalance.toLocaleString()}</p>
                            </div>
                        </div>
                        <Button onClick={() => handleShare(currentUserRank.rank, currentUserRank.winningBalance)}>
                            <Share2 className="mr-2 h-4 w-4"/>
                            Share Rank
                        </Button>
                    </CardContent>
                </Card>
            )}

            {others.length > 0 && (
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-16 text-center">Rank</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead className="text-right">Winnings</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {others.map((player) => (
                        <TableRow key={player.id} className={cn(player.id === currentUser?.uid && 'bg-muted/50')}>
                            <TableCell className="text-center font-bold text-lg text-muted-foreground">{player.rank}</TableCell>
                            <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage src={player.photoURL || undefined} alt={player.displayName || 'U'} />
                                    <AvatarFallback>{player.displayName?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{player.displayName || 'Anonymous User'}</p>
                                    <p className="text-xs text-muted-foreground">{player.email || `user_${player.id.substring(0,6)}`}</p>
                                </div>
                            </div>
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-500">₹{player.winningBalance.toLocaleString()}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
            )}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4"/>
            <h3 className="text-xl font-semibold">The Leaderboard is Empty</h3>
            <p>Be the first to make your mark!</p>
        </div>
      )}
    </div>
  );
}
