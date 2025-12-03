
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Trophy, ExternalLink, RefreshCw, AlertTriangle, Users } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { collection, doc, getDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Interfaces
interface Submission {
    id: string;
    matchId: string;
    userId: string;
    userName: string;
    screenshotURL: string;
    selectedPosition: number;
    prize: number;
    submittedAt: string;
    status: 'Pending Verification' | 'Verified' | 'Flagged for Review';
}

interface GroupedSubmission {
    matchId: string;
    submissions: Submission[];
    hasConflict: boolean;
    players: { id: string; name: string }[];
}

// Main Page Component
export default function ManageResultsPage() {
    const { functions, firestore } = useFirebase();
    const [submissions, setSubmissions] = useState<GroupedSubmission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState<GroupedSubmission | null>(null);
    const [winnerId, setWinnerId] = useState<string>('');

    const fetchSubmissions = async () => {
        if (!functions) return;
        setIsLoading(true);
        try {
            const listSubmissionsFn = httpsCallable<unknown, Submission[]>(functions, 'listResultSubmissions');
            const result = await listSubmissionsFn();
            const data = result.data;

            // Group submissions by matchId
            const grouped = data.reduce((acc, sub) => {
                if (!acc[sub.matchId]) {
                    acc[sub.matchId] = { 
                        matchId: sub.matchId, 
                        submissions: [], 
                        hasConflict: false,
                        players: [] // Will be populated later
                    };
                }
                acc[sub.matchId].submissions.push(sub);
                return acc;
            }, {} as Record<string, GroupedSubmission>);

            // Check for conflicts
            Object.values(grouped).forEach(group => {
                const winningClaims = group.submissions.filter(s => s.selectedPosition === 1);
                if (winningClaims.length > 1) {
                    group.hasConflict = true;
                }
            });

            setSubmissions(Object.values(grouped));
        } catch (error: any) {
            console.error("Error fetching submissions:", error);
            toast.error('Failed to fetch submissions', { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [functions]);

    const handleDeclareWinner = async (match: GroupedSubmission) => {
        if (!firestore) return;
        const matchDoc = await getDoc(doc(firestore, 'matches', match.matchId));
        if(matchDoc.exists()) {
            const matchData = matchDoc.data();
            const players = Object.entries(matchData.playerInfo).map(([id, info]) => ({ id, name: (info as any).name }));
            setSelectedMatch({ ...match, players });
        }
        setWinnerId('');
    };

    const handleConfirmWinner = async () => {
        if (!selectedMatch || !winnerId || !functions) return;

        const toastId = toast.loading('Declaring winner and distributing prize...');
        try {
            const distributeWinningsFn = httpsCallable(functions, 'distributeWinnings');
            await distributeWinningsFn({ matchId: selectedMatch.matchId, winnerId });

            toast.success('Winner declared successfully!', { 
                id: toastId, 
                description: 'The match has been completed and the prize has been awarded.'
            });
            setSelectedMatch(null);
            fetchSubmissions(); // Refresh the list
        } catch (error: any) {
            toast.error('Failed to declare winner', { 
                id: toastId, 
                description: error.message 
            });
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className='flex-row items-center justify-between'>
                    <div>
                        <CardTitle className="flex items-center"><Trophy className="mr-2" />Match Result Submissions</CardTitle>
                        <CardDescription>Review screenshots submitted by players and declare a winner.</CardDescription>
                    </div>
                    <Button variant='outline' size='icon' onClick={fetchSubmissions} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : submissions.length === 0 ? (
                        <p className="text-center text-muted-foreground py-12">No pending submissions found.</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {submissions.map((group) => (
                                <Card key={group.matchId} className={cn(group.hasConflict && 'border-red-500')}>
                                    <CardHeader>
                                        <CardTitle className='text-lg flex items-center justify-between'>
                                            <span>Match ID</span>
                                            <Link href={`/admin/matches/${group.matchId}`} passHref>
                                               <Button variant='ghost' size='sm'><ExternalLink className='h-4 w-4'/></Button>
                                            </Link>
                                        </CardTitle>
                                         <p className='text-xs font-mono truncate'>{group.matchId}</p>
                                        {group.hasConflict && (
                                            <Badge variant="destructive" className='flex items-center gap-1.5'><AlertTriangle className='h-3 w-3'/>Conflicting Claims</Badge>
                                        )}
                                    </CardHeader>
                                    <CardContent className='space-y-3'>
                                        {group.submissions.map(sub => (
                                            <div key={sub.id} className='flex items-start gap-3'>
                                                <img src={sub.screenshotURL} alt={`Screenshot by ${sub.userName}`} className='w-16 h-16 rounded-md object-cover cursor-pointer' onClick={() => window.open(sub.screenshotURL, '_blank')}/>
                                                <div>
                                                    <p className='font-semibold'>{sub.userName}</p>
                                                    <p className='text-sm'>Claimed Rank: <span className='font-bold'>{sub.selectedPosition}</span></p>
                                                    <p className='text-xs text-muted-foreground'>{new Date(sub.submittedAt).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                    <DialogFooter className='p-4 border-t'>
                                        <Button className='w-full' onClick={() => handleDeclareWinner(group)}><Trophy className='mr-2 h-4 w-4'/>Declare Winner</Button>
                                    </DialogFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Declare Match Winner</DialogTitle>
                        <p className='text-sm text-muted-foreground font-mono pt-2'>{selectedMatch?.matchId}</p>
                         {selectedMatch?.hasConflict && (
                             <p className='text-sm text-red-500 flex items-center gap-2 pt-2'><AlertTriangle className='h-4 w-4'/>Multiple players are claiming victory. Please review carefully.</p>
                         )}
                    </DialogHeader>
                    <div className="py-4">
                        <Select value={winnerId} onValueChange={setWinnerId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a player..." />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedMatch?.players.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                           <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleConfirmWinner} disabled={!winnerId}>Confirm Winner</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
