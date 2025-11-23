'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser } from '@/firebase';
import { uploadFile } from '@/firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload } from 'lucide-react';

export default function DepositPage() {
    const { user, isUserLoading } = useUser();
    const { functions, firestore } = useFirebase();
    const router = useRouter();

    const [amount, setAmount] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [upiId, setUpiId] = useState('');
    const [payeeName, setPayeeName] = useState('Ludo Wizard');
    const [submitStep, setSubmitStep] = useState('');

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    useEffect(() => {
        const fetchPaymentSettings = async () => {
            if (!firestore) return;
            setIsLoadingSettings(true);
            try {
                const settingsDoc = await getDoc(doc(firestore, 'settings', 'payments'));
                if (settingsDoc.exists()) {
                    const data = settingsDoc.data();
                    setUpiId(data.upiId || '');
                    setPayeeName(data.payeeName || 'Ludo Wizard');
                }
            } catch (error) {
                console.error("Error fetching payment settings:", error);
                toast.error("Error", { description: "Could not load payment details." });
            }
            setIsLoadingSettings(false);
        };
        fetchPaymentSettings();
    }, [firestore]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                toast.error("Invalid File", { description: "Please upload an image file." });
                return;
            }
            setScreenshot(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !functions) return;

        if (!amount || !transactionId || !screenshot) {
            toast.error("Missing Fields", { description: "Please fill out all fields and upload a screenshot." });
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Upload the screenshot
            setSubmitStep('Uploading screenshot...');
            const downloadURL = await uploadFile(screenshot, `deposits/${user.uid}`, transactionId);

            // 2. Call the cloud function with the URL
            setSubmitStep('Submitting request...');
            const requestDeposit = httpsCallable(functions, 'requestDeposit');
            await requestDeposit({
                amount: Number(amount),
                transactionId,
                screenshotUrl: downloadURL,
            });

            toast.success("Success", { description: "Your deposit request has been submitted for verification." });
            router.push('/wallet');

        } catch (error: any) {
            console.error("Deposit request failed:", error);
            const errorMessage = error.message || "An unexpected error occurred.";
            toast.error("Submission Failed", { description: errorMessage });
        } finally {
            setIsSubmitting(false);
            setSubmitStep('');
        }
    };

    if (isUserLoading || isLoadingSettings) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto max-w-md py-8">
            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Request a Deposit</CardTitle>
                        <CardDescription>Complete the steps below to add funds to your wallet.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>1. Payment Details</Label>
                            <div className="p-4 rounded-lg bg-muted/50 border">
                                <p className="text-sm font-medium">Send payment to:</p>
                                <p className="text-lg font-semibold font-mono break-all">{upiId}</p>
                                <p className="text-xs text-muted-foreground">(Payee: {payeeName})</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">2. Amount & Transaction ID</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="Enter amount (e.g., 500)"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                className="text-base"
                            />
                            <Input
                                id="transactionId"
                                type="text"
                                placeholder="Enter 12-digit UTR/Transaction ID"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                required
                                minLength={12}
                                className="text-base"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="screenshot">3. Upload Screenshot</Label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    id="screenshot"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    required
                                />
                                <Label htmlFor="screenshot" className="flex-1 cursor-pointer rounded-md border-2 border-dashed border-muted p-4 text-center text-sm text-muted-foreground hover:border-primary">
                                    <Upload className="mx-auto h-6 w-6 mb-1" />
                                    {screenshot ? `${screenshot.name}` : 'Click to select an image'}
                                </Label>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {submitStep || 'Submitting...'}</> : 
                                'Submit for Verification'
                            }
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
