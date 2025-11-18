
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, LogIn, Gamepad2, Wallet, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: <Gamepad2 className="w-10 h-10 text-primary" />,
      title: "Create & Join Matches",
      description: "Easily create your own Ludo matches with custom entry fees or join existing ones to challenge other players.",
    },
    {
      icon: <Wallet className="w-10 h-10 text-primary" />,
      title: "Secure Wallet System",
      description: "Manage your funds with a secure wallet. Deposit money to play and withdraw your winnings safely.",
    },
    {
      icon: <ShieldCheck className="w-10 h-10 text-primary" />,
      title: "Admin Oversight",
      description: "A dedicated admin panel to manage matches, users, and transactions, ensuring a fair and smooth gaming experience.",
    },
  ];

  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <main className="relative isolate overflow-hidden bg-background">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white)] dark:bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.900),theme(colors.background))] opacity-20"></div>
          <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-background shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 dark:bg-background dark:shadow-indigo-900/10 dark:ring-indigo-900 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center"></div>
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-40">
              <div className="mx-auto max-w-2xl lg:mx-0 lg:flex-auto">
                  <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                      Welcome to the <span className="text-primary">Ludo</span> Arena
                  </h1>
                  <p className="mt-6 text-lg leading-8 text-muted-foreground">
                      Challenge players, create matches, and climb the leaderboard. Your ultimate Ludo experience starts here.
                  </p>
                  <div className="mt-10 flex items-center gap-x-6">
                      <Button size="lg" onClick={() => router.push('/signup')}>Get Started <ArrowRight className="ml-2" /></Button>
                      <Button size="lg" variant="outline" onClick={() => router.push('/login')}><LogIn className="mr-2"/> Login</Button>
                  </div>
              </div>
          </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to compete
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Our platform provides a seamless and secure environment for competitive Ludo.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        {feature.icon}
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                </CardHeader>
                <CardDescription>{feature.description}</CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 sm:py-32 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground">Get Started in Minutes</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Joining the arena is simple and straightforward.
          </p>
        </div>
        <div className="mt-16 max-w-5xl mx-auto grid md:grid-cols-4 gap-8 text-center px-6 lg:px-8">
            <div className="p-4">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl mx-auto ring-8 ring-background">1</div>
                <h3 className="mt-6 text-lg font-semibold">Sign Up</h3>
                <p className="mt-1 text-muted-foreground">Create your account to get started.</p>
            </div>
             <div className="p-4">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl mx-auto ring-8 ring-background">2</div>
                <h3 className="mt-6 text-lg font-semibold">Add Funds</h3>
                <p className="mt-1 text-muted-foreground">Deposit money securely into your wallet.</p>
            </div>
             <div className="p-4">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl mx-auto ring-8 ring-background">3</div>
                <h3 className="mt-6 text-lg font-semibold">Join a Match</h3>
                <p className="mt-1 text-muted-foreground">Find an open match or create your own.</p>
            </div>
             <div className="p-4">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl mx-auto ring-8 ring-background">4</div>
                <h3 className="mt-6 text-lg font-semibold">Play & Win</h3>
                <p className="mt-1 text-muted-foreground">Compete, win, and see your earnings grow.</p>
            </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section id="cta" className="py-20 sm:py-32">
        <div className="max-w-2xl mx-auto text-center px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to roll the dice?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of players and start your journey to become a Ludo champion today.
          </p>
          <Button 
            size="lg" 
            className="mt-8"
            onClick={() => router.push('/signup')}
          >
            Sign Up for Free <ArrowRight className="ml-2" />
          </Button>
        </div>
      </section>

      <footer className="w-full py-6 px-4 sm:px-20 text-center text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} Ludo Arena. All rights reserved.</p>
      </footer>
    </div>
  );
}
