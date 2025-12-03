
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
import { doc, onSnapshot } from 'firebase/firestore';
import { Gamepad2, Users, Lock, Unlock, Clock, IndianRupee, Loader2, Share2, Copy, CheckCircle, ArrowRight, Info, Wallet } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingScreen } from '@/components/ui/loading';

export default function CreateMatchPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const { functions, firestore } = useFirebase();

    const [entryFee, setEntryFee] = useState([50]);
    const [isCreating, setIsCreating] = useState(false);
    const [createdMatchId, setCreatedMatchId] = useState('');

    const createMatchFunction = useMemo(() => {
        if (!functions) return null;
        return httpsCallable(functions, 'createMatch');
    }, [functions]);

    const handleCreateMatch = async () => {
        if (!user || !createMatchFunction) {
            toast.error("User or Firebase Functions not available.");
            return;
        }

        // Wallet check can be done on the server-side for security
        
        setIsCreating(true);
        try {
            const result = await createMatchFunction({ fee: entryFee[0] });
            const data = result.data as { matchId: string };
            setCreatedMatchId(data.matchId);
            toast.success("Match Created!", { description: `Match ID: ${data.matchId}` });
            router.push(`/match/${data.matchId}`);
        } catch (error: any) {
            console.error("Error creating match: ", error);
            toast.error("Failed to Create Match", { description: error.message || "An internal error occurred." });
        } finally {
            setIsCreating(false);
        }
    };
    
    if (isUserLoading) {
        return <LoadingScreen text="Loading..." />;
    }

    return (
        <div className="container mx-auto max-w-md py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Match</CardTitle>
                    <CardDescription>Set the entry fee and create a match.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Label>Entry Fee</Label>
                            <span className="text-2xl font-bold text-primary">₹{entryFee[0]}</span>
                        </div>
                        <Slider value={entryFee} onValueChange={setEntryFee} min={10} max={1000} step={10} />
                         <p className="text-xs text-muted-foreground text-center">The winner gets 1.8x the entry fee.</p>
                    </div>
                    
                    <Button onClick={handleCreateMatch} size="lg" className="w-full" disabled={isCreating}>
                        {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gamepad2 className="mr-2 h-4 w-4" />}
                        Create Match & Play
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
