'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth, useFirebase } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Subscription {
  id: string;
  name: string;
  price: number;
  duration: number; // in days
}

const SubscriptionsPage = () => {
  const { user } = useAuth();
  const { firestore: db } = useFirebase();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchSubscriptionsAndWallet = async () => {
      if (!db) return;
      // Fetch subscriptions
      const subsSnapshot = await getDocs(collection(db, 'subscriptions'));
      const subsData = subsSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Subscription)
      );
      setSubscriptions(subsData);

      // Fetch wallet balance
      if (user) {
        const walletRef = doc(db, 'wallets', user.uid);
        const walletSnap = await getDoc(walletRef);
        if (walletSnap.exists()) {
          setWalletBalance(walletSnap.data().balance);
        }
      }
    };

    fetchSubscriptionsAndWallet();
  }, [user, db]);

  const handlePurchase = async (subscription: Subscription) => {
    if (!user || !db) return;

    if (walletBalance < subscription.price) {
      toast.error('Insufficient wallet balance. Please deposit funds.');
      return;
    }

    try {
      const walletRef = doc(db, 'wallets', user.uid);
      const newBalance = walletBalance - subscription.price;

      await updateDoc(walletRef, { balance: newBalance });

      const userSubscriptionRef = doc(db, 'userSubscriptions', user.uid);
      const userSubSnap = await getDoc(userSubscriptionRef);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + subscription.duration);

      if (userSubSnap.exists()) {
        await updateDoc(userSubscriptionRef, {
          subscriptionId: subscription.id,
          expiresAt: expiryDate,
        });
      } else {
        await setDoc(userSubscriptionRef, {
          subscriptionId: subscription.id,
          expiresAt: expiryDate,
        });
      }

      setWalletBalance(newBalance);

      toast.success('Subscription purchased successfully');
    } catch (error) {
      toast.error('Failed to purchase subscription.');
    }
  };

  return (
    <div className='p-4 grid gap-4 md:grid-cols-3'>
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle>Your Wallet</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold">₹{walletBalance.toFixed(2)}</p>
                    <Button onClick={() => router.push('/deposit')}>Deposit</Button>
                </div>
            </CardContent>
        </Card>

      {subscriptions.map((sub) => (
        <Card key={sub.id}>
          <CardHeader>
            <CardTitle>{sub.name}</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-lg font-semibold'>Price: ₹{sub.price}</p>
            <p>Duration: {sub.duration} days</p>
            <Button onClick={() => handlePurchase(sub)}>Purchase</Button>
          </CardContent>
        </Card>
      ))}
      {subscriptions.length === 0 && (
        <p className="col-span-full text-center text-muted-foreground">No subscription plans available yet.</p>
      )}
    </div>
  );
};

export default SubscriptionsPage;
