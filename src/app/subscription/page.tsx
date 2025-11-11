'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SubscriptionPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>('monthly');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const plans = [
    {
      id: 'weekly',
      name: 'Weekly Plan',
      price: '₹500',
      duration: '/week',
      features: [
        'Access to all groups',
        'Daily number updates',
        'Email support',
      ],
      cta: 'Choose Weekly',
    },
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: '₹1,800',
      duration: '/month',
      features: [
        'Everything in Weekly',
        'Priority support',
        'Access to historical data',
      ],
      cta: 'Choose Monthly',
      popular: true,
    },
    {
      id: 'six-monthly',
      name: '6-Monthly Plan',
      price: '₹9,000',
      duration: '/6 months',
      features: [
        'Everything in Monthly',
        'Exclusive community access',
        '24/7 dedicated support',
      ],
      cta: 'Choose 6-Monthly',
    },
  ];

  const handleSubscription = () => {
    // Placeholder for payment gateway integration
    alert(`Proceeding to payment for ${selectedPlan} plan.`);
  }

  return (
    <main className="flex flex-col items-center justify-center p-4">
      <div className="text-center z-10 max-w-4xl mx-auto w-full">
        <header className="mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-islamic-gold mb-6 leading-tight">
            Subscription Plans
          </h1>
          <p className="text-xl md:text-2xl text-white mb-4">
            Choose a plan that works for you.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={cn(
                "bg-white bg-opacity-10 border-white border-opacity-20 text-white text-left flex flex-col transition-all",
                selectedPlan === plan.id ? 'border-islamic-gold border-2 scale-105' : 'hover:scale-105',
                plan.popular ? 'relative' : ''
              )}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-4 right-4 bg-islamic-gold text-islamic-dark text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-islamic-gold text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-islamic-cream">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-lg">{plan.duration}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-islamic-gold" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={cn(
                    "w-full font-bold text-lg py-6",
                    selectedPlan === plan.id ? 'bg-islamic-gold text-islamic-dark' : 'bg-white bg-opacity-20'
                  )}
                  variant={selectedPlan === plan.id ? 'default' : 'secondary'}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-12">
            <Button 
                size="lg" 
                className="bg-accent text-accent-foreground text-xl font-bold px-12 py-8"
                onClick={handleSubscription}
                disabled={!selectedPlan}
            >
                Proceed to Payment
            </Button>
        </div>

      </div>
    </main>
  );
}
