'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Upload, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode.react';

interface Plan {
  id: string;
  name: string;
  price: string;
  priceAmount: number;
  duration: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

export default function SubscriptionPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const { toast } = useToast();

  const upiId = 'yourbusiness@paytm'; // Placeholder UPI ID

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const plans: Plan[] = [
    {
      id: 'weekly',
      name: 'Weekly Plan',
      price: '₹500',
      priceAmount: 500,
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
      priceAmount: 1800,
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
      priceAmount: 9000,
      duration: '/6 months',
      features: [
        'Everything in Monthly',
        'Exclusive community access',
        '24/7 dedicated support',
      ],
      cta: 'Choose 6-Monthly',
    },
  ];
  
  useEffect(() => {
    // Pre-select the monthly plan on initial load
    const monthlyPlan = plans.find(p => p.id === 'monthly');
    if (monthlyPlan) {
      setSelectedPlan(monthlyPlan);
    }
  }, []);

  const handleProceedToPayment = () => {
    if (selectedPlan) {
      setShowPaymentSection(true);
    } else {
      toast({
        variant: "destructive",
        title: "No Plan Selected",
        description: "Please choose a subscription plan first.",
      });
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setScreenshot(event.target.files[0]);
    }
  };

  const handleSubmitPayment = () => {
    if (!screenshot || !transactionId) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please upload the screenshot and enter the transaction ID.",
      });
      return;
    }
    // Placeholder for submission logic
    console.log({
      plan: selectedPlan?.id,
      transactionId,
      screenshot,
    });
    
    toast({
      title: "Submitted for Verification",
      description: "Your payment is being verified. Your subscription will be activated soon.",
    });

    setShowPaymentSection(false);
    setTransactionId('');
    setScreenshot(null);
  };
  
  const getUpiDeepLink = () => {
    if(!selectedPlan) return '';
    return `upi://pay?pa=${upiId}&pn=Islamic%20Draw&am=${selectedPlan.priceAmount}&cu=INR`;
  }

  if (isUserLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
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

        {!showPaymentSection ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <Card 
                  key={plan.id} 
                  className={cn(
                    "bg-white bg-opacity-10 border-white border-opacity-20 text-white text-left flex flex-col transition-all cursor-pointer",
                    selectedPlan?.id === plan.id ? 'border-islamic-gold border-2 scale-105' : 'hover:scale-105',
                    plan.popular ? 'relative' : ''
                  )}
                  onClick={() => setSelectedPlan(plan)}
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
                        selectedPlan?.id === plan.id ? 'bg-islamic-gold text-islamic-dark' : 'bg-white bg-opacity-20'
                      )}
                      variant={selectedPlan?.id === plan.id ? 'default' : 'secondary'}
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
                    onClick={handleProceedToPayment}
                    disabled={!selectedPlan}
                >
                    Proceed to Payment
                </Button>
            </div>
          </>
        ) : (
          <Card className="w-full max-w-2xl mx-auto bg-white bg-opacity-10 border-islamic-gold border-opacity-20 text-white">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-islamic-gold">
                Complete Your Payment
              </CardTitle>
              <CardDescription className="text-islamic-cream">
                Pay <strong className="text-white">{selectedPlan?.price}</strong> for the <strong className="text-white">{selectedPlan?.name}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center bg-white bg-opacity-10 rounded-lg p-4 border border-white border-opacity-20">
                <p className="text-islamic-cream">Pay using the UPI ID or scan the QR Code:</p>
                <p className="text-2xl font-mono my-2 text-islamic-gold">{upiId}</p>
                 <div className="flex justify-center my-4">
                  {selectedPlan && <QRCode value={getUpiDeepLink()} size={128} bgColor="transparent" fgColor="#FFD700" />}
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  navigator.clipboard.writeText(upiId);
                  toast({ title: "UPI ID Copied!", description: "The UPI ID has been copied to your clipboard." });
                }}>Copy UPI ID</Button>
              </div>

              <div className="space-y-4">
                <p className="text-center font-semibold text-islamic-cream">After payment, submit the details below:</p>
                <div className="space-y-2">
                  <Label htmlFor="transaction_id">Transaction ID / UTR</Label>
                  <Input 
                    id="transaction_id" 
                    placeholder="Enter the 12-digit transaction ID" 
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="bg-white bg-opacity-20 border-white border-opacity-30 text-white placeholder-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="screenshot">Payment Screenshot</Label>
                  <Input 
                    id="screenshot" 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="bg-white bg-opacity-20 border-white border-opacity-30 text-white file:text-islamic-cream"
                  />
                  {screenshot && <p className="text-sm text-islamic-cream">Selected: {screenshot.name}</p>}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button onClick={handleSubmitPayment} className="w-full bg-accent text-accent-foreground font-bold" disabled={!screenshot || !transactionId}>
                Submit for Verification
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setShowPaymentSection(false)}>
                Back to Plans
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </main>
  );
}
