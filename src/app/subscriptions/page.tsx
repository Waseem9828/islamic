'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useUser, useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, arrayUnion } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const subscriptionGroups = [
  { id: 'faridabad', name: 'Faridabad' },
  { id: 'ghaziabad', name: 'Ghaziabad' },
  { id: 'gali', name: 'Gali' },
  { id: 'disawar', name: 'Disawar' },
].map(group => ({
    ...group,
    plans: [
      { id: 'weekly', name: 'Weekly', price: '₹50' },
      { id: 'monthly', name: 'Monthly', price: '₹150' },
      { id: 'yearly', name: 'Yearly', price: '₹1500' },
    ]
}));

export default function SubscriptionsPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubscribe = (groupId: string, planId: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You must be logged in to subscribe.',
      });
      router.push('/login');
      return;
    }
    
    // For now, we will just add the subscription without a real payment flow.
    const userDocRef = doc(firestore, 'users', user.uid);
    updateDocumentNonBlocking(userDocRef, {
        subscriptions: arrayUnion(groupId)
    });

    toast({
      title: 'Subscribed!',
      description: `You have subscribed to the ${groupId} group.`,
    });
  };

  if (isUserLoading) {
      return <div className="p-4 text-center">Loading...</div>
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Subscription Plans</h1>
      {subscriptionGroups.map((group) => (
        <Card key={group.id} className="bg-muted/30">
          <CardHeader>
            <CardTitle>{group.name}</CardTitle>
            <CardDescription>
              Choose a plan to view the numbers for this group.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.plans.map((plan, index) => (
              <div key={plan.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">{plan.price}</p>
                  </div>
                  <Button onClick={() => handleSubscribe(group.id, plan.id)}>
                    Subscribe
                  </Button>
                </div>
                {index < group.plans.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
