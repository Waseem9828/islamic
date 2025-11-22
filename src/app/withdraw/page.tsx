'use client';

import { useState, useEffect, useMemo } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useFirebase, useUser } from '@/firebase/provider';
import { doc, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, IndianRupee } from 'lucide-react';

interface Wallet {
    winningBalance: number;
}

interface UserProfile {
    upiId?: string;
}

export default function WithdrawPage() {
  const { user } = useUser();
  const { functions, firestore } = useFirebase();
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const requestWithdrawalFunction = useMemo(() => {
    if (!functions) return null;
    return httpsCallable(functions, 'requestWithdrawal');
  }, [functions]);

  useEffect(() => {
    if (user && firestore) {
      const walletRef = doc(firestore, 'wallets', user.uid);
      const userRef = doc(firestore, 'users', user.uid);
      
      const unsubWallet = onSnapshot(walletRef, (docSnap) => {
        if (docSnap.exists()) {
          setWallet(docSnap.data() as Wallet);
        } else {
          setWallet(null);
        }
        setIsLoading(false);
      }, (error) => {
        console.error("Failed to listen to wallet changes:", error);
        toast.error("Failed to load wallet data.");
        setIsLoading(false);
      });

      const unsubUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as UserProfile;
          if (userData.upiId) {
            setUpiId(userData.upiId);
          }
        }
      });

      return () => {
        unsubWallet();
        unsubUser();
      };
    } else {
        setIsLoading(false);
    }
  }, [user, firestore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestWithdrawalFunction) {
        toast.error('Functions service not ready.');
        return;
    }

    const withdrawalAmount = parseInt(amount, 10);

    if (!user || !wallet) return;
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      toast.error('Invalid Amount', { description: 'Please enter a valid number greater than zero.' });
      return;
    }
    if (withdrawalAmount > wallet.winningBalance) {
      toast.error('Insufficient Winnings', { description: 'You can only withdraw from your winning balance.' });
      return;
    }
    if (!upiId.match(/^[\\w.-]+@[\w.-]+$/)) {
        toast.error('Invalid UPI ID', { description: 'Please enter a valid UPI ID (e.g., yourname@bank).' });
        return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestWithdrawalFunction({ amount: withdrawalAmount, upiId });
      const responseData = (result.data as any).result as { status: string; message: string }; 

      if (responseData.status === 'success') {
        toast.success('Request Submitted', { description: responseData.message || 'Your withdrawal request has been sent for approval.' });
        setAmount('');
      } else {
        throw new Error(responseData.message || 'Failed to submit request.');
      }
    } catch (error: any) {
      console.error('Error requesting withdrawal:', error);
      toast.error('Submission Failed', { description: error.message || 'An unknown error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-lg py-8">
      <Card>
        <CardHeader>
          <CardTitle>Request a Withdrawal</CardTitle>
          <CardDescription>Withdraw funds from your winning balance. Requests are subject to admin approval.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="p-4 mb-4 bg-secondary/50 border border-secondary rounded-lg">
                <p className="text-sm text-muted-foreground">Available for Withdrawal</p>
                {isLoading ? 
                    <Loader2 className="h-5 w-5 animate-spin mt-1"/> :
                    <p className="text-2xl font-bold">₹{wallet?.winningBalance?.toFixed(2) || '0.00'}</p>
                }
                <p className="text-xs text-muted-foreground mt-1">You can only withdraw from your winnings.</p>
            </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-muted-foreground mb-1">Amount (₹)</label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="upiId" className="block text-sm font-medium text-muted-foreground mb-1">Your UPI ID</label>
              <Input
                id="upiId"
                type="text"
                placeholder="e.g., yourname@bank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || isLoading}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <IndianRupee className="mr-2 h-4 w-4"/>}
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
