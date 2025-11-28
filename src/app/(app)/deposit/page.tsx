
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser } from '@/firebase';
import { uploadFile } from '@/firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import QRCode from 'qrcode.react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, Copy, IndianRupee, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default function DepositPage() {
    const { user, isUserLoading } = useUser();
    const { functions, firestore } = useFirebase();
    const router = useRouter();

    const [amount, setAmount] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [upiId, setUpiId] = useState('');
    const [payeeName, setPayeeName] = useState('Ludo Wizard');
    const [submitStep, setSubmitStep] = useState('');
    const [submitProgress, setSubmitProgress] = useState(0);

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
                } else {
                     toast.error("Payment Settings Not Found", { description: "Admin needs to configure payment settings." });
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
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setScreenshot(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setScreenshotPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            toast.error("Invalid File", { description: "Please upload a valid image file." });
            setScreenshot(null);
            setScreenshotPreview(null);
        }
    };
    
    const copyToClipboard = () => {
        if(!upiId) return;
        navigator.clipboard.writeText(upiId);
        toast.success("UPI ID copied to clipboard!");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !functions) return;

        if (!amount || !transactionId || !screenshot) {
            toast.error("Missing Fields", { description: "Please fill out all fields and upload a screenshot." });
            return;
        }

        setIsSubmitting(true);
        setSubmitProgress(0);

        try {
            setSubmitStep('Uploading screenshot...');
            const downloadURL = await uploadFile(
                screenshot,
                `deposits/${user.uid}`,
                `${transactionId}-${Date.now()}`,
                (progress) => setSubmitProgress(progress)
            );

            setSubmitStep('Finalizing submission...');
            const requestDepositFn = httpsCallable(functions, 'requestDeposit');
            const result = await requestDepositFn({
                amount: Number(amount),
                transactionId,
                screenshotUrl: downloadURL,
            });

            const resultData = result.data as { status: string; message: string; };

            if (resultData.status === 'success') {
                 toast.success("Success", { description: "Your deposit request has been submitted for verification." });
                 router.push('/wallet');
            } else {
                throw new Error(resultData.message || 'An unknown error occurred.');
            }

        } catch (error: any) {
            console.error("Deposit request failed:", error);
            const errorMessage = error.message || "An unexpected error occurred.";
            toast.error("Submission Failed", { description: errorMessage });
        } finally {
            setIsSubmitting(false);
            setSubmitStep('');
            setSubmitProgress(0);
        }
    };

    if (isUserLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount || '0'}&cu=INR`;

    return (
        <div className="container mx-auto py-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Column - Payment Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-t-4 border-primary">
                        <CardHeader>
                            <CardTitle>1. Make Payment</CardTitle>
                            <CardDescription>Enter an amount, then scan the QR code or use the UPI ID to pay.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="amount" className="flex items-center"><IndianRupee className="mr-2 h-4 w-4"/>Amount to Deposit</Label>
                                <Input
                                    id="amount" type="number" placeholder="e.g., 500"
                                    value={amount || ''} onChange={(e) => setAmount(e.target.value)}
                                    required className="text-base"
                                    disabled={isLoadingSettings}
                                />
                            </div>
                            {isLoadingSettings ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin mt-2" /></div> : upiId ? (
                                <div className="space-y-4 text-center">
                                    <div className="bg-muted p-4 rounded-lg flex items-center justify-center">
                                       <QRCode value={upiUri} size={200} level="M" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Payee Name: {payeeName}</p>
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <p className="text-lg font-semibold font-mono break-all">{upiId}</p>
                                            <Button variant="ghost" size="icon" onClick={copyToClipboard}><Copy className="h-4 w-4"/></Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground p-4 border rounded-lg">
                                    <p>The admin has not configured payment details yet. Please check back later.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Form */}
                <div className="lg:col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Submit Proof</CardTitle>
                            <CardDescription>After payment, fill out this form with the correct details.</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="transactionId">12-digit UTR / Transaction ID</Label>
                                    <Input
                                        id="transactionId" type="text" placeholder="Found in your payment app's details"
                                        value={transactionId} onChange={(e) => setTransactionId(e.target.value)}
                                        required minLength={12} className="text-base font-mono"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="screenshot">Payment Screenshot</Label>
                                    <Input id="screenshot" type="file" accept="image/*" onChange={handleFileChange} className="hidden" required />
                                    <Label htmlFor="screenshot" className="cursor-pointer">
                                        <div className="flex items-center justify-center w-full h-48 border-2 border-dashed border-muted rounded-lg text-center hover:border-primary transition-colors">
                                            {screenshotPreview ? (
                                                <Image src={screenshotPreview} alt="Screenshot Preview" width={200} height={192} className="object-contain h-full w-full p-2" />
                                            ) : (
                                                <div className="text-muted-foreground">
                                                    <ImageIcon className="mx-auto h-10 w-10 mb-2" />
                                                    Click to select an image
                                                </div>
                                            )}
                                        </div>
                                    </Label>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" size="lg" className="w-full text-base" disabled={isSubmitting || !amount}>
                                    {isSubmitting ? (
                                        <div className="flex items-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            <span>
                                                {submitStep}
                                                {submitProgress > 0 && submitProgress < 100 && ` (${Math.round(submitProgress)}%)`}
                                            </span>
                                        </div>
                                    ) : (
                                        'Submit for Verification'
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
