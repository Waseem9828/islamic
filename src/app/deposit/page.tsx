
'use client';

import { useState } from 'react';
import { useUser, useFirebase } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function DepositPage() {
    const { user } = useUser();
    const { firestore, functions } = useFirebase(); // Correct way to get services
    const [amount, setAmount] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const upiId = "ludowizard.dev@ybl"; // Replace with your actual UPI ID

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !functions || !firestore) {
            toast.error('You must be logged in to make a deposit.');
            return;
        }

        const depositAmount = parseFloat(amount);
        if (isNaN(depositAmount) || depositAmount <= 0) {
            toast.error('Please enter a valid amount.');
            return;
        }
        if (!transactionId) {
            toast.error('Please enter the transaction ID.');
            return;
        }

        setIsSubmitting(true);
        try {
            const requestDeposit = httpsCallable(functions, 'requestDeposit');
            const result = await requestDeposit({ amount: depositAmount, transactionId });
            toast.success('Deposit request submitted', {
                description: 'Your request is under review and will be processed shortly.',
            });
            setAmount('');
            setTransactionId('');
        } catch (error: any) {
            console.error("Error submitting deposit request:", error);
            toast.error('Submission failed', {
                description: error.message || 'An unknown error occurred.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto max-w-md py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Make a Deposit</CardTitle>
                    <CardDescription>Follow the steps below to add funds to your wallet.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4 text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Scan the QR code or use the UPI ID</p>
                        <div>
                           <img src="/qr.jpeg" alt="UPI QR Code" className="mx-auto w-48 h-48 rounded-md" />
                        </div>
                        <p className="font-mono text-lg font-semibold">{upiId}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount Deposited</Label>
                            <Input 
                                id="amount" 
                                type="number" 
                                placeholder="e.g., 500" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="transactionId">Transaction ID / UTR</Label>
                            <Input 
                                id="transactionId" 
                                type="text" 
                                placeholder="Your 12-digit transaction reference" 
                                value={transactionId} 
                                onChange={(e) => setTransactionId(e.target.value)} 
                                required 
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
