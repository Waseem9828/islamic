
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, LogIn } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-black">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
          Welcome to the <span className="text-purple-600">Ludo</span> Arena
        </h1>

        <p className="mt-3 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
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

      <footer className="w-full py-6 px-4 sm:px-20 text-center text-gray-500 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} Ludo Arena. All rights reserved.</p>
      </footer>
    </div>
  );
}
