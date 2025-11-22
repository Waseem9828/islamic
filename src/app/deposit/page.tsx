'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirebase } from '@/firebase/provider'; 
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import QRCode from 'qrcode.react';

export default function DepositPage() {
    const { user } = useUser();
    const { functions, firestore } = useFirebase();
    const [amount, setAmount] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [upiId, setUpiId] = useState('');
    const [payeeName, setPayeeName] = useState('Ludo Wizard'); // Default name

    useEffect(() => {
        const fetchSettings = async () => {
            if (firestore) {
                const settingsRef = doc(firestore, 'settings', 'payment');
                try {
                    const docSnap = await getDoc(settingsRef);
                    if (docSnap.exists()) {
                        const settings = docSnap.data();
                        setUpiId(settings.upiId || '');
                        setPayeeName(settings.payeeName || 'Ludo Wizard');
                    }
                } catch (error) {
                    console.error("Error fetching payment settings:", error);
                    toast.error("Could not load payment settings.");
                } finally {
                    setIsLoadingSettings(false);
                }
            }
        };
        fetchSettings();
    }, [firestore]);

    const requestDepositFunction = useMemo(() => {
        if (!functions) return null;
        return httpsCallable(functions, 'requestDeposit');
    }, [functions]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error('You must be logged in to make a deposit.');
            return;
        }

        if (!requestDepositFunction) {
            toast.error('Cannot connect to services. Please try again later.');
            return;
        }

        const depositAmount = parseFloat(amount);
        if (isNaN(depositAmount) || depositAmount <= 0) {
            toast.error('Please enter a valid amount.');
            return;
        }
        if (!transactionId || transactionId.trim().length < 12) {
            toast.error('Please enter the valid 12-digit transaction ID.');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await requestDepositFunction({ amount: depositAmount, transactionId: transactionId.trim() });
            const data = (result.data as any)?.result;
            toast.success('Deposit request submitted', {
                description: data?.message || 'Your request is under review and will be processed shortly.',
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
    
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=LudoDeposit`;

    return (
        <div className="container mx-auto max-w-md py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Make a Deposit</CardTitle>
                    <CardDescription>Follow the steps below to add funds to your wallet.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isLoadingSettings ? (
                         <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className="space-y-4 text-center p-4 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">1. Enter amount & scan QR or use UPI ID</p>
                            <div className="flex justify-center p-2 bg-white rounded-md">
                               {upiId && parseFloat(amount) > 0 ? (
                                    <QRCode value={upiLink} size={192} />
                                ) : (
                                    <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-center text-sm text-gray-500">Enter an amount to generate QR code</div>
                                )}
                            </div>
                            <p className="font-mono text-lg font-semibold">{upiId}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount to Deposit</Label>
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
                            <Label htmlFor="transactionId">2. Transaction ID / UTR</Label>
                            <Input 
                                id="transactionId" 
                                type="text" 
                                placeholder="Enter the 12-digit transaction ID" 
                                value={transactionId} 
                                onChange={(e) => setTransactionId(e.target.value)} 
                                required 
                                minLength={12}
                                maxLength={12}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting || isLoadingSettings}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isSubmitting ? 'Submitting...' : '3. Submit for Verification'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
