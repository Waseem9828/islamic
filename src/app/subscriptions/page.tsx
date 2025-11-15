
'use client';
import { useState, useMemo } from 'react';
import { collection, doc, updateDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useFirebase, useCollection, useDoc } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface Subscription {
  id: string;
  name: string;
  price: number;
  duration: number; // in days
}

const SubscriptionsPage = () => {
  const { user, firestore: db, isUserLoading } = useFirebase();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const router = useRouter();

  // Real-time subscriptions
  const subscriptionsQuery = useMemo(() => db ? collection(db, 'subscriptions') : null, [db]);
  const { data: subscriptions, isLoading: isSubsLoading } = useCollection<Subscription>(subscriptionsQuery);

  // Real-time wallet balance
  const walletRef = useMemo(() => db && user ? doc(db, 'wallets', user.uid) : null, [db, user]);
  const { data: walletData, isLoading: isWalletLoading } = useDoc(walletRef);
  const walletBalance = walletData?.balance ?? 0;

  const handlePurchase = async (subscription: Subscription) => {
    if (!user || !db) {
        toast.error('You must be logged in to purchase a subscription.');
        return;
    };
    
    if (walletBalance < subscription.price) {
      toast.error('Insufficient wallet balance.', {
        description: 'Please deposit more funds to continue.',
        action: {
          label: 'Deposit',
          onClick: () => router.push('/deposit'),
        },
      });
      return;
    }
    
    setPurchasingId(subscription.id);

    try {
      // 1. Deduct from wallet
      const walletRef = doc(db, 'wallets', user.uid);
      await updateDoc(walletRef, { 
          balance: increment(-subscription.price) 
      });

      // 2. Set user subscription
      const userSubscriptionRef = doc(db, 'userSubscriptions', user.uid);
      const userSubSnap = await getDoc(userSubscriptionRef);
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + subscription.duration);

      const subscriptionData = {
          subscriptionId: subscription.id,
          subscriptionName: subscription.name,
          purchasedAt: serverTimestamp(),
          expiresAt: expiryDate,
          userId: user.uid
      };
      
      await setDoc(userSubscriptionRef, subscriptionData, { merge: true });

      toast.success('Subscription purchased successfully!');
      
    } catch (error) {
      console.error('Subscription purchase error: ', error);
      toast.error('Failed to purchase subscription.', {
          description: 'Please try again later.'
      });
      // Optional: Add refund logic if subscription write fails after wallet deduction
    } finally {
        setPurchasingId(null);
    }
  };

  const isLoading = isUserLoading || isSubsLoading || isWalletLoading;
  
  if (!user && !isUserLoading) {
      router.push('/login');
      return null;
  }

  return (
    <div className='p-4 grid gap-4 md:grid-cols-3'>
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle>Your Wallet</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    {isLoading ? <Skeleton className="h-10 w-32" /> : <p className="text-3xl font-bold">₹{walletBalance.toFixed(2)}</p>}
                    <Button onClick={() => router.push('/deposit')}>Deposit</Button>
                </div>
            </CardContent>
        </Card>

      {isLoading && (
          <>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </>
      )}

      {!isLoading && subscriptions?.map((sub) => (
        <Card key={sub.id}>
          <CardHeader>
            <CardTitle>{sub.name}</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-lg font-semibold'>Price: ₹{sub.price}</p>
            <p>Duration: {sub.duration} days</p>
            <Button onClick={() => handlePurchase(sub)} disabled={purchasingId === sub.id}>
              {purchasingId === sub.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {purchasingId === sub.id ? 'Purchasing...' : 'Purchase'}
            </Button>
          </CardContent>
        </Card>
      ))}
      {!isLoading && subscriptions?.length === 0 && (
        <p className="col-span-full text-center text-muted-foreground py-10">No subscription plans available yet.</p>
      )}
    </div>
  );
};

export default SubscriptionsPage;
