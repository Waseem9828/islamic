
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from 'sonner';
import { Gamepad2, Users, Lock, Unlock, Clock, IndianRupee, ChevronRight, CheckCircle, Copy, Share2, List, Info, Wallet } from 'lucide-react';
import { useUser } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
import { firestore, functions } from '@/firebase/config';
import { httpsCallable } from 'firebase/functions';

const entryFees = [50, 100, 500, 1000, 2000];
const timeLimits = ['15 min', '30 min', '1 hour'];
const MIN_ENTRY_FEE = 50;

interface MatchDetails {
  entryFee: number;
  maxPlayers: number;
  privacy: 'public' | 'private';
  timeLimit: string;
  roomCode: string;
  matchTitle: string;
  id: string;
}

// Define the Cloud Function
const createMatchFunction = httpsCallable(functions, 'createMatch');

export default function CreateMatchPage() {
  const { user } = useUser();
  const router = useRouter();
  const [entryFee, setEntryFee] = useState<number | 'custom'>(MIN_ENTRY_FEE);
  const [customEntryFee, setCustomEntryFee] = useState<string>('');
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public');
  const [timeLimit, setTimeLimit] = useState<string>('1 hour');
  const [roomCode, setRoomCode] = useState<string>('');
  const [matchTitle, setMatchTitle] = useState<string>('');
  const [matchCreated, setMatchCreated] = useState<boolean>(false);
  const [createdMatchDetails, setCreatedMatchDetails] = useState<MatchDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userWallet, setUserWallet] = useState({ deposit: 0, winning: 0, total: 0 });

  useEffect(() => {
    if (user) {
      const walletDocRef = doc(firestore, "wallets", user.uid);
      getDoc(walletDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const deposit = data.depositBalance || 0;
          const winning = data.winningBalance || 0;
          setUserWallet({ deposit, winning, total: deposit + winning });
        }
      });
    }
  }, [user]);

  const handleCreateMatch = async () => {
    if (!user) { toast.error('You must be logged in to create a match.'); return; }
    
    const finalEntryFee = entryFee === 'custom' ? parseFloat(customEntryFee) : entryFee;
    if (isNaN(finalEntryFee) || finalEntryFee < MIN_ENTRY_FEE) { toast.error(`Entry fee must be at least ₹${MIN_ENTRY_FEE}.`); return; }
    if (userWallet.total < finalEntryFee) { toast.error('Insufficient balance.', { description: `Your balance is ₹${userWallet.total.toFixed(2)}.` }); return; }
    if (!roomCode || roomCode.trim().length < 4) { toast.error('Please enter a valid Room Code (at least 4 characters).'); return; }
    if (!matchTitle) { toast.error('Please enter a match title.'); return; }
    
    setIsSubmitting(true);
    const matchId = roomCode.toUpperCase();

    try {
      const result = await createMatchFunction({
        matchId: matchId,
        matchTitle: matchTitle,
        entryFee: finalEntryFee,
        maxPlayers: maxPlayers,
        privacy: privacy,
        timeLimit: timeLimit,
      });

      if (result.data.status === 'success') {
        setCreatedMatchDetails({
          id: result.data.matchId,
          roomCode: result.data.matchId,
          matchTitle: matchTitle,
          entryFee: finalEntryFee,
          maxPlayers: maxPlayers,
          privacy: privacy,
          timeLimit: timeLimit,
        });
        setMatchCreated(true);
        toast.success('Match created successfully!');
      } else {
        // The 'else' might not be needed if errors are always thrown
        throw new Error('Failed to create match');
      }

    } catch (error: any) {
      console.error('Error calling createMatch function:', error);
      // Firebase Functions error objects have a 'message' property
      toast.error('Match creation failed.', { description: error.message || 'An unknown error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => { if (createdMatchDetails?.roomCode) { navigator.clipboard.writeText(createdMatchDetails.roomCode); toast.success('Room code copied to clipboard!'); } };
  const handleShare = () => { if (navigator.share && createdMatchDetails) { navigator.share({ title: `Join my Ludo match: ${createdMatchDetails.matchTitle}`, text: `Join my Ludo match!\nRoom Code: ${createdMatchDetails.roomCode}\nEntry Fee: ₹${createdMatchDetails.entryFee}`, url: window.location.href, }).catch(err => console.log('Error sharing', err)); } else { handleCopyCode(); toast.info("Sharing not supported. Room code copied instead."); } };

  if (matchCreated && createdMatchDetails) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <Card className="border-t-4 border-green-500">
          <CardHeader className="text-center"><CheckCircle className="mx-auto h-12 w-12 text-green-500" /><CardTitle className="text-2xl font-bold mt-4">Match Created!</CardTitle><CardDescription>Your match is ready. Share the code with other players.</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2"><Label className="text-muted-foreground">Room Code</Label><div className="p-4 bg-muted rounded-lg border-2 border-dashed"><p className="text-4xl font-bold tracking-[0.3em]">{createdMatchDetails.roomCode}</p></div></div>
            <div className="grid grid-cols-2 gap-4"><Button variant="outline" onClick={handleCopyCode}><Copy className="mr-2 h-4 w-4"/> Copy Code</Button><Button variant="outline" onClick={handleShare}><Share2 className="mr-2 h-4 w-4"/> Share</Button></div>
            <Card className="bg-muted/50"><CardHeader className='p-4'><CardTitle className="text-lg flex items-center"><Info className="mr-2 h-5 w-5"/> Match Details</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground p-4 pt-0"><ul className="space-y-2"><li className='flex justify-between'><span>Entry Fee:</span> <span className="font-semibold">₹{createdMatchDetails.entryFee}</span></li><li className='flex justify-between'><span>Max Players:</span> <span className="font-semibold">{createdMatchDetails.maxPlayers}</span></li><li className='flex justify-between'><span>Privacy:</span> <span className="font-semibold capitalize">{createdMatchDetails.privacy}</span></li><li className='flex justify-between'><span>Time Limit:</span> <span className="font-semibold">{createdMatchDetails.timeLimit}</span></li></ul></CardContent></Card>
            <div className="text-sm text-muted-foreground space-y-2 bg-yellow-50 border border-yellow-200 p-4 rounded-lg"><h4 className="font-semibold text-yellow-800">Instructions:</h4><ol className="list-decimal list-inside space-y-1"><li>Share this room code with your friends.</li><li>Wait for all players to join the match lobby.</li><li>Click 'Ready to Start' when the room is full.</li><li>Open Ludo King and enter the same room code.</li></ol></div>
            <Button onClick={() => router.push(`/match/${createdMatchDetails.id}`)} className="w-full text-lg py-6"><List className="mr-2 h-5 w-5"/> Go to Match Lobby</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold"><Gamepad2 className="mr-2 h-6 w-6" /> Create Ludo Match</CardTitle>
          <CardDescription>Fill in the details below to start a new match.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-muted-foreground flex items-center"><Wallet className="mr-2 h-4 w-4"/> Your Balance</span>
            <div className='text-right'>
              <span className="font-bold text-lg">₹{userWallet.total.toFixed(2)}</span>
              <p className='text-xs text-muted-foreground'>Deposit: ₹{userWallet.deposit.toFixed(2)} | Winnings: ₹{userWallet.winning.toFixed(2)}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-lg font-semibold flex items-center"><IndianRupee className="mr-2 h-5 w-5" />Entry Fee</Label>
            <RadioGroup value={entryFee.toString()} onValueChange={(value) => setEntryFee(value === 'custom' ? 'custom' : parseInt(value))} className="grid grid-cols-3 gap-2">
              {entryFees.map((fee) => (<Label key={fee} className="flex items-center space-x-2 p-3 rounded-md border cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary transition-all"><RadioGroupItem value={fee.toString()} /><span>₹{fee}</span></Label>))}
              <Label className="flex items-center space-x-2 p-3 rounded-md border cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary transition-all"><RadioGroupItem value="custom" /><span>Custom</span></Label>
            </RadioGroup>
            {entryFee === 'custom' && (<Input type="number" placeholder={`Enter custom fee (Min ₹${MIN_ENTRY_FEE})`} value={customEntryFee} onChange={(e) => setCustomEntryFee(e.target.value)} className="mt-2" />)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2"><Label className="text-lg font-semibold flex items-center"><Users className="mr-2 h-5 w-5" />Max Players</Label><RadioGroup value={maxPlayers.toString()} onValueChange={(v) => setMaxPlayers(parseInt(v))} className="flex space-x-4 pt-2">{[2, 4].map(p => <Label key={p} className="flex items-center space-x-2 cursor-pointer"><RadioGroupItem value={p.toString()} /><span>{p} Players</span></Label>)}</RadioGroup></div>
            <div className="space-y-2"><Label className="text-lg font-semibold flex items-center"><Lock className="mr-2 h-5 w-5" />Privacy</Label><RadioGroup value={privacy} onValueChange={(v: 'public' | 'private') => setPrivacy(v)} className="flex space-x-4 pt-2"><Label className="flex items-center space-x-2 cursor-pointer"><RadioGroupItem value="public" /><Unlock className="mr-1 h-4 w-4"/><span>Public</span></Label><Label className="flex items-center space-x-2 cursor-pointer"><RadioGroupItem value="private" /><Lock className="mr-1 h-4 w-4"/><span>Private</span></Label></RadioGroup></div>
          </div>
          <div className="space-y-2"><Label className="text-lg font-semibold flex items-center"><Clock className="mr-2 h-5 w-5" />Time Limit</Label><RadioGroup value={timeLimit} onValueChange={setTimeLimit} className="grid grid-cols-3 gap-2">{timeLimits.map(t => <Label key={t} className="flex items-center space-x-2 p-3 rounded-md border cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary transition-all"><RadioGroupItem value={t} /><span>{t}</span></Label>)}</RadioGroup></div>
          <div className="space-y-2">
            <Label htmlFor="roomCode" className="text-lg font-semibold">Room Code (Min 4 chars, Max 10 chars)</Label>
            <Input id="roomCode" placeholder="e.g. LUDO123" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} maxLength={10} className="tracking-wider font-mono text-lg" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="matchTitle" className="text-lg font-semibold">Match Title</Label>
            <Input id="matchTitle" placeholder="e.g., Friendly Afternoon Game" value={matchTitle} onChange={(e) => setMatchTitle(e.target.value)} />
          </div>

          <Button onClick={handleCreateMatch} disabled={isSubmitting} className="w-full text-lg py-6 flex items-center justify-center">{isSubmitting ? 'Creating Match...' : 'Create Match'}<ChevronRight className="ml-2 h-5 w-5" /></Button>
        </CardContent>
      </Card>
    </div>
  );
}
