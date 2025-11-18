
'use client';

import { useState, useMemo } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, firestore } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, IndianRupee, Copy } from 'lucide-react';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { doc } from 'firebase/firestore';

const requestDepositFunction = httpsCallable(functions, 'requestDeposit');

// Separated Form component to prevent re-renders from parent's data fetching
function DepositForm({ isLoadingSettings }: { isLoadingSettings: boolean }) {
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const depositAmount = parseInt(amount, 10);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast.error('Invalid Amount', { description: 'Please enter a valid number.' });
      return;
    }
    if (!transactionId) {
      toast.error('Transaction ID Required', { description: 'Please enter the payment transaction ID.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await requestDepositFunction({ amount: depositAmount, transactionId });
      toast.success('Request Submitted', { description: 'Your deposit request is under review. Please wait for admin approval.' });
      setAmount('');
      setTransactionId('');
    } catch (error: any) {
      console.error('Error submitting deposit request:', error);
      toast.error('Submission Failed', { description: error.message || 'An unknown error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Deposit Request</CardTitle>
        <CardDescription>Fill this form after you have completed the payment.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-muted-foreground mb-1">Amount Deposited (₹)</label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter exact amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="transactionId" className="block text-sm font-medium text-muted-foreground mb-1">Transaction ID / UTR</label>
            <Input
              id="transactionId"
              type="text"
              placeholder="Enter the 12-digit UTR number"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting || isLoadingSettings}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <IndianRupee className="mr-2 h-4 w-4" />}
            Submit for Verification
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function DepositPage() {
  const paymentSettingsRef = useMemo(() => doc(firestore, 'settings', 'payment'), []);
  const [paymentSettings, isLoadingSettings] = useDocumentData(paymentSettingsRef);

  const copyToClipboard = () => {
    if (paymentSettings?.upiId) {
      navigator.clipboard.writeText(paymentSettings.upiId);
      toast.success('UPI ID Copied!');
    }
  }

  return (
    <div className="container mx-auto max-w-lg py-8">
      <Card className="mb-6 bg-secondary/30 border-dashed">
        <CardHeader>
          <CardTitle>How to Deposit?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>1. Pay your desired amount to the UPI ID given below using any payment app.</p>
          <div className="flex items-center gap-2 p-3 rounded-md bg-background">
            {isLoadingSettings ?
              <Loader2 className="h-5 w-5 animate-spin" /> :
              <p className="font-mono text-lg font-bold">{paymentSettings?.upiId || 'UPI ID not set'}</p>
            }
            <Button variant="ghost" size="icon" onClick={copyToClipboard} disabled={!paymentSettings?.upiId}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p>2. After a successful payment, enter the amount and the Transaction ID in the form below.</p>
          <p>3. Your balance will be updated after admin verification.</p>
        </CardContent>
      </Card>
      
      <DepositForm isLoadingSettings={!!isLoadingSettings} />
    </div>
  );
}
