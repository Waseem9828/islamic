
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, LogIn, Gamepad2, Wallet, ShieldCheck, Users, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: <Gamepad2 className="w-10 h-10 text-purple-500" />,
      title: "Create & Join Matches",
      description: "Easily create your own Ludo matches with custom entry fees or join existing ones to challenge other players.",
    },
    {
      icon: <Wallet className="w-10 h-10 text-purple-500" />,
      title: "Secure Wallet System",
      description: "Manage your funds with a secure wallet. Deposit money to play and withdraw your winnings safely.",
    },
    {
      icon: <ShieldCheck className="w-10 h-10 text-purple-500" />,
      title: "Admin Oversight",
      description: "A dedicated admin panel to manage matches, users, and transactions, ensuring a fair and smooth gaming experience for everyone.",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-950 px-4 sm:px-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
          Welcome to the <span className="text-purple-600">Ludo</span> Arena
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
          Challenge players, create matches, and climb the leaderboard. Your ultimate Ludo experience starts here.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-transform transform hover:scale-105" 
            onClick={() => router.push('/signup')}
          >
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-8 py-6 rounded-full shadow-lg transition-transform transform hover:scale-105" 
            onClick={() => router.push('/login')}
          >
            <LogIn className="mr-2 h-5 w-5" /> Login
          </Button>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Everything you need to compete
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Our platform provides a seamless and secure environment for competitive Ludo.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center p-6 hover:shadow-xl transition-shadow">
                <CardHeader>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
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
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Get Started in Minutes</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Joining the arena is simple and straightforward.
          </p>
        </div>
        <div className="mt-12 max-w-5xl mx-auto grid md:grid-cols-4 gap-4 text-center">
            <div className="p-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-600 text-white font-bold text-xl mx-auto">1</div>
                <h3 className="mt-4 text-lg font-semibold">Sign Up</h3>
                <p className="mt-1 text-gray-600 dark:text-gray-400">Create your account to get started.</p>
            </div>
             <div className="p-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-600 text-white font-bold text-xl mx-auto">2</div>
                <h3 className="mt-4 text-lg font-semibold">Add Funds</h3>
                <p className="mt-1 text-gray-600 dark:text-gray-400">Deposit money securely into your wallet.</p>
            </div>
             <div className="p-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-600 text-white font-bold text-xl mx-auto">3</div>
                <h3 className="mt-4 text-lg font-semibold">Join a Match</h3>
                <p className="mt-1 text-gray-600 dark:text-gray-400">Find an open match or create your own.</p>
            </div>
             <div className="p-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-600 text-white font-bold text-xl mx-auto">4</div>
                <h3 className="mt-4 text-lg font-semibold">Play & Win</h3>
                <p className="mt-1 text-gray-600 dark:text-gray-400">Compete, win, and see your earnings grow.</p>
            </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section id="cta" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Ready to roll the dice?
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Join thousands of players and start your journey to become a Ludo champion today.
          </p>
          <Button 
            size="lg" 
            className="mt-8 text-lg px-8 py-6 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-transform transform hover:scale-105" 
            onClick={() => router.push('/signup')}
          >
            Sign Up for Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <footer className="w-full py-6 px-4 sm:px-20 text-center text-gray-500 dark:text-gray-400 border-t dark:border-gray-800">
        <p>&copy; {new Date().getFullYear()} Ludo Arena. All rights reserved.</p>
      </footer>
    </div>
  );
}
