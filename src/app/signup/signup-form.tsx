
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/firebase/provider';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { FirebaseError } from 'firebase/app';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { auth, firestore } = useFirebase();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) {
      toast.error('Auth service is not available. Please try again later.');
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user and wallet documents in Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, {
        email: user.email,
        displayName: user.email?.split('@')[0] || 'New User',
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active',
      });
      
      const walletDocRef = doc(firestore, 'wallets', user.uid);
      await setDoc(walletDocRef, {
        depositBalance: 0,
        winningBalance: 0,
        bonusBalance: 0,
      });


      toast.success('Signed up successfully');
      router.push('/matchmaking'); // Redirect to the matchmaking page
    } catch (error) {
      if (error instanceof FirebaseError) {
        let message = error.message;
        if(error.code === 'auth/email-already-in-use'){
          message = 'This email is already registered. Please login instead.'
        } else if (error.code === 'auth/weak-password') {
          message = 'Password should be at least 6 characters.'
        }
        toast.error(message);
      } else {
        toast.error('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <Card className="w-full max-w-md mx-4">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold">Create an Account</CardTitle>
        <CardDescription>
          Enter your email below to begin your journey.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignUp}>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="underline font-semibold">
                Login
              </Link>
            </div>
        </CardFooter>
      </form>
    </Card>
  );
}
