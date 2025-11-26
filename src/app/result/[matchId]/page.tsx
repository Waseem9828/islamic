
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirebase, useUser } from '@/firebase/provider';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { Trophy, Upload, List, Info, Loader2, IndianRupee } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const calculateWinnings = (totalPool: number, playerCount: number): { position: number; prize: number }[] => {
    const commission = totalPool * 0.10;
    const netPool = totalPool - commission;
    // Simplified prize structure
    switch (playerCount) {
        case 2: return [{ position: 1, prize: Math.floor(netPool) }, { position: 2, prize: 0 }];
        case 3: return [{ position: 1, prize: Math.floor(netPool * 0.7) }, { position: 2, prize: Math.floor(netPool * 0.3) }, { position: 3, prize: 0 }];
        case 4: return [{ position: 1, prize: Math.floor(netPool * 0.6) }, { position: 2, prize: Math.floor(netPool * 0.3) }, { position: 3, prize: Math.floor(netPool * 0.1) }, { position: 4, prize: 0 }];
        default: return [];
    }
};

export default function SubmitResultPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();
  const { firestore, storage } = useFirebase();
  const matchId = params.matchId as string;
  
  const [match, setMatch] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);

  useEffect(() => {
    if (!matchId || !firestore) return;
    const fetchMatch = async () => {
      const matchRef = doc(firestore, 'matches', matchId);
      try {
        const docSnap = await getDoc(matchRef);
        if (docSnap.exists()) {
          setMatch({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Match not found");
          router.push('/matchmaking');
        }
      } catch (error) {
        toast.error("Failed to fetch match data.");
        console.error("Error fetching match:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [matchId, router, firestore]);

  const prizeDistribution = useMemo(() => {
      if (!match) return [];
      const playerCount = match.players.length;
      const totalPool = match.entryFee * playerCount;
      return calculateWinnings(totalPool, playerCount);
  }, [match]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setScreenshot(e.target.files[0]);
  };

  const handleSubmitResult = async () => {
    if (!user || !match || !selectedPosition || !screenshot || !storage || !firestore) {
      toast.error("Please fill all fields and upload a screenshot.");
      return;
    }
    setIsSubmitting(true);

    try {
      // 1. Upload Screenshot
      const screenshotRef = ref(storage, `results/${match.id}/${user.uid}/${Date.now()}`);
      const uploadResult = await uploadBytes(screenshotRef, screenshot);
      const screenshotUrl = await getDownloadURL(uploadResult.ref);

      // 2. Update Firestore document
      const matchRef = doc(firestore, 'matches', match.id);
      const winning = prizeDistribution.find(p => p.position === parseInt(selectedPosition))?.prize || 0;

      const resultData = {
        position: parseInt(selectedPosition),
        screenshotUrl,
        submittedAt: new Date(),
        status: 'Pending Verification',
        estimatedWinnings: winning
      };

      await updateDoc(matchRef, { 
          [`results.${user.uid}`]: resultData,
          status: 'pending_verification' // Update match status
      });

      toast.success("Result submitted successfully!", {
        description: `Position: ${selectedPosition}. Est. Winning: ₹${winning}. Results are under review.`,
      });
      router.push('/matchmaking');

    } catch (error) {
        console.error("Error submitting result:", error);
        toast.error("Submission failed.", { description: "Could not upload screenshot or save result." });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading || !match) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin h-8 w-8"/></div>;

  const playerCount = match.players.length;
  const totalPool = match.entryFee * playerCount;
  const isUserInMatch = user && match.players.includes(user.uid);

  if (!isUserInMatch) {
      return (
          <div className="container mx-auto max-w-2xl py-8">
              <Alert variant="destructive">
                  <AlertTitle>Access Denied</AlertTitle>
                  <AlertDescription>You are not a player in this match.</AlertDescription>
              </Alert>
          </div>
      )
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card className="border-t-4 border-yellow-500">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-bold"><Trophy className="mr-2 h-6 w-6" /> Submit Result - {match.id}</CardTitle>
          <CardDescription>The match is complete. Please report your final position and upload a screenshot.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4 text-center bg-muted/50 p-3 rounded-lg">
            <div><p className="text-sm text-muted-foreground">Entry Fee</p><p className="font-bold flex items-center justify-center gap-1"><IndianRupee className="h-4 w-4"/>{match.entryFee}</p></div>
            <div><p className="text-sm text-muted-foreground">Players</p><p className="font-bold">{playerCount}</p></div>
            <div><p className="text-sm text-muted-foreground">Total Pool</p><p className="font-bold flex items-center justify-center gap-1"><IndianRupee className="h-4 w-4"/>{totalPool}</p></div>
          </div>

          <div>
            <Label className="text-lg font-semibold">Select Your Position</Label>
            <RadioGroup onValueChange={setSelectedPosition} className={`mt-2 grid grid-cols-2 gap-4`}>
              {prizeDistribution.map(item => (
                <Label key={item.position} htmlFor={`pos-${item.position}`} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                  <RadioGroupItem value={String(item.position)} id={`pos-${item.position}`} />
                  <span className="font-semibold">{item.position}{item.position === 1 ? 'st' : item.position === 2 ? 'nd' : item.position === 3 ? 'rd' : 'th'} Place</span>
                  <span className={`text-sm ${item.prize > 0 ? 'text-green-600' : 'text-red-600'} font-bold ml-auto`}>{item.prize > 0 ? `Win ₹${item.prize}` : 'No Win'}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="screenshot-upload" className="text-lg font-semibold">Upload Result Screenshot</Label>
            <div className="mt-2"><Label htmlFor="screenshot-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted"><div className="flex flex-col items-center justify-center pt-5 pb-6"><Upload className="w-10 h-10 mb-3 text-muted-foreground" />{screenshot ? <p className="font-semibold text-green-600">{screenshot.name}</p> : <><p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p><p className="text-xs text-muted-foreground">PNG or JPG (MAX. 5MB)</p></>}</div><Input id="screenshot-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg" /></Label></div> 
          </div>

          <div className="text-sm text-muted-foreground space-y-2 bg-blue-50 border border-blue-200 p-4 rounded-lg text-left dark:bg-blue-900/20 dark:border-blue-500/30 dark:text-blue-200">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center"><Info className="mr-2 h-5 w-5"/> Verification Process:</h4>
              <ul className="list-disc list-inside space-y-1">
                  <li>All players must submit their results.</li>
                  <li>Our system verifies all screenshots and positions.</li>
                  <li>Winnings are automatically transferred after successful verification. A 10% platform fee is applied to the total prize pool.</li>
              </ul>
          </div>

          <Button onClick={handleSubmitResult} disabled={isSubmitting || !selectedPosition || !screenshot} className="w-full text-lg py-6">{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Submitting...</> : 'Submit Result'}</Button>
          <Button variant="outline" className="w-full" onClick={() => router.push('/matchmaking')}><List className="mr-2 h-4 w-4"/> Back to All Matches</Button>
        </CardContent>
      </Card>
    </div>
  );
}

    