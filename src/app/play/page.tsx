'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { toast } from 'sonner';
import { httpsCallable } from 'firebase/functions';
import { useFirebase, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Gamepad2, Users, Lock, Unlock, Clock, IndianRupee, Loader2, Share2, Copy, CheckCircle, ArrowRight, Info, Wallet } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function PlayPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const { functions, firestore } = useFirebase();

    const [matchTitle, setMatchTitle] = useState('');
    const [entryFee, setEntryFee] = useState([50]);
    const [maxPlayers, setMaxPlayers] = useState('2');
    const [privacy, setPrivacy] = useState('public');
    const [timeLimit, setTimeLimit] = useState('15');
    const [matchId, setMatchId] = useState('');

    const [wallet, setWallet] = useState<{ depositBalance: number, winningBalance: number, bonusBalance: number } | null>(null);
    const [isLoadingWallet, setIsLoadingWallet] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isMatchCreated, setIsMatchCreated] = useState(false);
    
    useEffect(() => {
        // Generate room code only on the client side after hydration
        setMatchId(generateRoomCode());
    }, []);

    const totalBalance = useMemo(() => {
        if (!wallet) return 0;
        return wallet.depositBalance + wallet.winningBalance + wallet.bonusBalance;
    }, [wallet]);
    
    useEffect(() => {
        if (user && firestore) {
            const walletRef = doc(firestore, 'wallets', user.uid);
            getDoc(walletRef).then(docSnap => {
                if (docSnap.exists()) {
                    setWallet(docSnap.data() as any);
                } else {
                    setWallet({ depositBalance: 0, winningBalance: 0, bonusBalance: 0 });
                }
                setIsLoadingWallet(false);
            }).catch(err => {
                toast.error("Failed to load wallet.");
                setIsLoadingWallet(false);
            });
        } else if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, firestore, isUserLoading, router]);

    const createMatchFunction = useMemo(() => {
        if (!functions) return null;
        return httpsCallable(functions, 'createMatch');
    }, [functions]);


    const handleCreateMatch = async () => {
        if (!user || !createMatchFunction) {
            toast.error("User or Firebase Functions not available.");
            return;
        }

        if (totalBalance < entryFee[0]) {
            toast.error("Insufficient Balance", { description: `You need at least ₹${entryFee[0]} to create this match.` });
            return;
        }
        
        setIsCreating(true);
        try {
            const result = await createMatchFunction({
                matchId,
                matchTitle: matchTitle || `Match ${matchId}`,
                entryFee: entryFee[0],
                maxPlayers: parseInt(maxPlayers),
                privacy,
                timeLimit: `${timeLimit} mins`
            });
            const data = (result.data as any).result as { status: string; message: string; matchId: string };
            if (data.status === 'success') {
                toast.success("Match Created!", { description: data.message });
                setMatchId(data.matchId);
                setIsMatchCreated(true);
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            console.error("Error creating match: ", error);
            toast.error("Failed to Create Match", { description: error.message || "An unknown error occurred." });
        } finally {
            setIsCreating(false);
        }
    };
    
    const handleCopyCode = () => {
        navigator.clipboard.writeText(matchId);
        toast.success("Room Code Copied!");
    };
    
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `Join my Ludo match: ${matchTitle || `Match ${matchId}`}`,
                text: `Join my Ludo match!\nRoom Code: ${matchId}\nEntry Fee: ₹${entryFee[0]}`,
                url: window.location.origin + `/match/${matchId}`,
            }).catch(err => console.log('Error sharing', err));
        } else {
            handleCopyCode();
            toast.info("Sharing not supported. Room code copied instead.");
        }
    };

    if (isUserLoading || isLoadingWallet) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    if (isMatchCreated) {
        return (
            <div className="container mx-auto max-w-md py-8">
                <Card>
                    <CardHeader className="text-center">
                        <CheckCircle className="mx-auto w-12 h-12 text-green-500" />
                        <CardTitle className="text-2xl font-bold mt-4">Match Created!</CardTitle>
                        <CardDescription>Your match is ready. Share the code with other players.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center space-y-2">
                            <Label className="text-muted-foreground">Room Code</Label>
                            <div className="p-4 bg-muted rounded-lg border-2 border-dashed">
                                <p className="text-4xl font-bold tracking-[0.3em]">{matchId}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <Button onClick={handleCopyCode} variant="outline" className="w-full"><Copy className="mr-2 h-4 w-4"/>Copy</Button>
                             <Button onClick={handleShare} className="w-full"><Share2 className="mr-2 h-4 w-4"/>Share</Button>
                        </div>
                         <Card className="bg-muted/50">
                            <CardHeader className='p-4'>
                                <CardTitle className="text-lg flex items-center"><Info className="mr-2 h-5 w-5"/> Match Details</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground p-4 pt-0">
                               <ul className="space-y-2">
                                  <li className="flex justify-between"><span>Entry Fee:</span> <span className="font-semibold">₹{entryFee[0]}</span></li>
                                  <li className="flex justify-between"><span>Players:</span> <span className="font-semibold">{maxPlayers}</span></li>
                                  <li className="flex justify-between"><span>Time Limit:</span> <span className="font-semibold">{timeLimit} mins</span></li>
                               </ul>
                            </CardContent>
                        </Card>
                         <Button onClick={() => router.push(`/match/${matchId}`)} className="w-full" size="lg">Go to Lobby <ArrowRight className="ml-2 h-4 w-4"/></Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-2xl py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center text-2xl"><Gamepad2 className="mr-2" />Create a New Match</CardTitle>
                    <CardDescription>Set up your game rules and challenge your friends or the community.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Alert variant={totalBalance < entryFee[0] ? "destructive" : "default"}>
                        <Wallet className="h-4 w-4" />
                        <AlertTitle>Wallet Balance</AlertTitle>
                        <AlertDescription>
                            Your total balance is ₹{totalBalance.toFixed(2)}. The entry fee of ₹{entryFee[0]} will be deducted upon creation.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <Label htmlFor="match-title">Match Title (Optional)</Label>
                        <Input id="match-title" placeholder="e.g., Weekend Ludo Clash" value={matchTitle} onChange={(e) => setMatchTitle(e.target.value)} />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label>Entry Fee</Label>
                            <span className="text-xl font-bold text-primary">₹{entryFee[0]}</span>
                        </div>
                        <Slider value={entryFee} onValueChange={setEntryFee} min={50} max={5000} step={10} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Max Players</Label>
                             <RadioGroup value={maxPlayers} onValueChange={setMaxPlayers} className="flex gap-4">
                                <Label className="flex items-center gap-2 p-3 border rounded-md has-[:checked]:border-primary"><RadioGroupItem value="2" id="p2" /><Users className="h-4 w-4"/> 2</Label>
                                <Label className="flex items-center gap-2 p-3 border rounded-md has-[:checked]:border-primary"><RadioGroupItem value="4" id="p4" /><Users className="h-4 w-4"/> 4</Label>
                            </RadioGroup>
                        </div>
                         <div className="space-y-2">
                            <Label>Privacy</Label>
                             <RadioGroup value={privacy} onValueChange={setPrivacy} className="flex gap-4">
                                <Label className="flex items-center gap-2 p-3 border rounded-md has-[:checked]:border-primary"><RadioGroupItem value="public" id="public" /><Unlock className="h-4 w-4"/> Public</Label>
                                <Label className="flex items-center gap-2 p-3 border rounded-md has-[:checked]:border-primary"><RadioGroupItem value="private" id="private" /><Lock className="h-4 w-4"/> Private</Label>
                            </RadioGroup>
                        </div>
                         <div className="space-y-2">
                            <Label>Time Limit</Label>
                            <RadioGroup value={timeLimit} onValueChange={setTimeLimit} className="flex gap-4">
                                <Label className="flex items-center gap-2 p-3 border rounded-md has-[:checked]:border-primary"><RadioGroupItem value="15" id="t15" /><Clock className="h-4 w-4"/> 15m</Label>
                                <Label className="flex items-center gap-2 p-3 border rounded-md has-[:checked]:border-primary"><RadioGroupItem value="30" id="t30" /><Clock className="h-4 w-4"/> 30m</Label>
                            </RadioGroup>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="match-id">Room Code</Label>
                        <div className="flex items-center gap-2">
                            <Input id="match-id" value={matchId} readOnly className="font-mono tracking-widest text-lg" />
                            <Button variant="secondary" onClick={() => setMatchId(generateRoomCode())}>Generate New</Button>
                        </div>
                    </div>
                    <Button onClick={handleCreateMatch} size="lg" className="w-full" disabled={isCreating || isLoadingWallet}>
                        {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <IndianRupee className="mr-2 h-4 w-4" />}
                        Create Match & Deduct ₹{entryFee[0]}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
