
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirebase } from '@/firebase/provider';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { FirebaseError } from 'firebase/app';
import Link from 'next/link';
import { Loader2, Mail, KeyRound, User, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.242,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);


export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { auth, firestore } = useFirebase();

  const handleSignUp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!auth || !firestore) {
      toast.error('Auth service is not available. Please try again later.');
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Also update the user's profile display name in Auth
      await updateProfile(user, { 
        displayName: displayName || user.email?.split('@')[0] || 'New User',
        photoURL: `https://avatar.vercel.sh/${user.email}.png`
      });

      // Create user document in Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, {
        email: user.email,
        displayName: displayName || user.email?.split('@')[0] || 'New User',
        photoURL: `https://avatar.vercel.sh/${user.email}.png`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active',
      });
      
      // Create wallet document for the new user
      const walletDocRef = doc(firestore, 'wallets', user.uid);
      await setDoc(walletDocRef, {
        depositBalance: 0,
        winningBalance: 0,
        bonusBalance: 0,
      });

      toast.success('Account created successfully!');
      router.push('/play');
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
    const handleGoogleSignIn = async () => {
        if (!auth) return;
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            // The onAuthStateChanged listener in FirebaseProvider will handle profile creation
            router.push('/play');
        } catch (error: any) {
            handleAuthError(error);
        }
    }
    
    const handleAuthError = (error: any) => {
        console.error("Auth Error:", error);
        let message = "An unknown error occurred.";
        if (error instanceof FirebaseError) {
            if(error.code === 'auth/email-already-in-use'){
              message = 'This email is already registered. Please login instead.'
            } else if (error.code === 'auth/weak-password') {
              message = 'Password should be at least 6 characters.'
            } else if (error.code === 'auth/popup-closed-by-user') {
                message = "Sign-in popup closed. Please try again.";
            } else {
                message = error.message;
            }
        }
        toast.error('Sign-up Failed', { description: message });
    }

  return (
     <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-white/20 animate-fade-in-up">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-card-foreground">Create an Account</CardTitle>
        <CardDescription className="text-card-foreground/80">
          Join the Ludo community and start playing!
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignUp}>
        <CardContent className="space-y-4">
            <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    id="displayName"
                    type="text"
                    placeholder="Full Name"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 h-12 text-base"
                />
            </div>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    id="email"
                    type="email"
                    placeholder="Email address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 h-12 text-base"
                />
            </div>
            <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    id="password" 
                    type="password" 
                    placeholder="Password (min. 6 characters)"
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 h-12 text-base"
                />
            </div>
          
            <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'Create Account'}
            </Button>
            
            <div className="relative">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-card px-2 text-sm text-muted-foreground">OR</span>
            </div>

            <Button type="button" variant="outline" size="lg" className="w-full h-12 text-base" onClick={handleGoogleSignIn} disabled={isLoading}>
                <GoogleIcon className="mr-2"/> Sign up with Google
            </Button>

        </CardContent>
        <CardFooter className="flex flex-col gap-4">
            <div className="text-center text-sm text-card-foreground/80">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Login here
              </Link>
            </div>
        </CardFooter>
      </form>
    </Card>
  );
}
