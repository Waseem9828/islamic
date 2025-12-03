
'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from 'sonner';
import { httpsCallable } from 'firebase/functions';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { PlusCircle, Gamepad2, Search, ArrowRight, Loader2 } from 'lucide-react';
import { useUser, useFirebase } from '@/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { LoadingScreen } from '@/components/ui/loading';


const MatchCard = ({ match, onJoin }: { match: any, onJoin: (matchId: string) => void }) => {
    const prizePool = match.fee * 2 * 0.9; // Assuming 2 players, 10% rake

    return (
        <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/50 animate-fade-in-up">
            <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="border-2 border-background h-12 w-12">
                    {/* Host's avatar logic can be added here */}
                    <AvatarFallback>{match.hostId.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-semibold truncate text-sm">Prize: ₹{prizePool.toFixed(0)}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Entry: ₹{match.fee}</span>
                    </div>
                </div>
                <Button onClick={() => onJoin(match.id)} size="sm">Join</Button>
            </CardContent>
        </Card>
    );
};

export default function PlayPage() {
  const router = useRouter();
  const { firestore, functions } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  const joinMatchFn = useMemo(() => functions ? httpsCallable(functions, 'joinMatch') : null, [functions]);

  useEffect(() => {
    if (!isUserLoading && !user) router.push('/login');
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'matches'), where("status", "==", "pending"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    }, (error) => {
      console.error("Failed to fetch matches:", error);
      toast.error("Failed to load matches.");
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);

  const handleJoin = useCallback(async (matchId: string) => {
    if (!joinMatchFn) return;
    setIsJoining(true);
    try {
        await joinMatchFn({ matchId });
        toast.success("Joined match successfully!");
        router.push(`/match/${matchId}`);
    } catch (err: any) {
        toast.error("Couldn't join match", { description: err.message });
    } finally {
        setIsJoining(false);
        setShowJoinDialog(false);
        setJoinCode('');
    }
  }, [joinMatchFn, router]);

  const handleJoinWithCode = async () => {
      if (!joinCode || !firestore) return;
      // Basic validation if match exists client side.
      // Server will do the real check.
      const matchDoc = await getDoc(doc(firestore, "matches", joinCode));
      if (!matchDoc.exists()) {
          toast.error("Invalid Match Code", { description: "The match you are trying to join does not exist." });
          return;
      }
      handleJoin(joinCode);
  }

  if (isUserLoading || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="p-4 space-y-4 animate-fade-in-up">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Live Matches</h1>
            <Button onClick={() => router.push('/play/new')}><PlusCircle className="mr-2 h-4 w-4"/>Create Match</Button>
        </div>

        <div className="flex gap-2">
            <Input 
                placeholder="Or enter a match code..." 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.trim())}
            />
            <Button onClick={() => handleJoinWithCode()} disabled={isJoining || !joinCode}>
                {isJoining ? <Loader2 className="h-4 w-4 animate-spin"/> : <ArrowRight className="h-4 w-4"/>}
            </Button>
        </div>

        <div className="space-y-3 pt-2">
            {matches.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">No open matches right now. Create one!</p>
            ) : (
                matches.map((m) => (
                    <MatchCard key={m.id} match={m} onJoin={handleJoin} />
                ))
            )}
        </div>
        
        <AlertDialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Join Private Match</AlertDialogTitle>
                    <AlertDialogDescription>Enter the match code you received to join.</AlertDialogDescription>
                </AlertDialogHeader>
                <Input 
                    placeholder="Enter Match Code" 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                />
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleJoinWithCode} disabled={!joinCode || isJoining}>
                         {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Join
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
