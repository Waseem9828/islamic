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

const subscriptionGroups = [
  {
    id: 'faridabad',
    name: 'Faridabad',
    plans: [
      { id: 'weekly', name: 'Weekly', price: '₹50' },
      { id: 'monthly', name: 'Monthly', price: '₹150' },
      { id: 'yearly', name: 'Yearly', price: '₹1500' },
    ],
  },
  {
    id: 'ghaziabad',
    name: 'Ghaziabad',
    plans: [
      { id: 'weekly', name: 'Weekly', price: '₹50' },
      { id: 'monthly', name: 'Monthly', price: '₹150' },
      { id: 'yearly', name: 'Yearly', price: '₹1500' },
    ],
  },
  {
    id: 'gali',
    name: 'Gali',
    plans: [
      { id: 'weekly', name: 'Weekly', price: '₹50' },
      { id: 'monthly', name: 'Monthly', price: '₹150' },
      { id: 'yearly', name: 'Yearly', price: '₹1500' },
    ],
  },
  {
    id: 'disawar',
    name: 'Disawar',
    plans: [
      { id: 'weekly', name: 'Weekly', price: '₹50' },
      { id: 'monthly', name: 'Monthly', price: '₹150' },
      { id: 'yearly', name: 'Yearly', price: '₹1500' },
    ],
  },
];

export default function SubscriptionsPage() {
  const handleSubscribe = (groupId: string, planId: string) => {
    console.log(`Subscribing to ${groupId} with ${planId} plan.`);
    // Future: Handle payment logic
  };

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
