
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    fetchSignInMethodsForEmail, 
    updateProfile
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, KeyRound, User, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { GoogleIcon } from '@/components/icons/google-icon';

// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: NodeJS.Timeout;
    return (...args: P<F>): void => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), waitFor);
    };
}

type P<T> = T extends (...args: infer P) => any ? P : never;

export function LoginForm() {
    const { auth, firestore } = useFirebase();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const [authMode, setAuthMode] = useState('unknown'); 
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // --- Email Checking Logic ---
    const checkEmailExists = async (email: string) => {
        if (!auth || !email) return;
        setIsCheckingEmail(true);
        try {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            setAuthMode(methods.length > 0 ? 'login' : 'signup');
        } catch (error: any) {
            setAuthMode('unknown'); 
        }
        setIsCheckingEmail(false);
    };

    const debouncedCheckEmail = debounce(checkEmailExists, 500);

    useEffect(() => {
        if (email && isClient && email.includes('@')) {
            debouncedCheckEmail(email);
        } else {
            setAuthMode('unknown');
        }
    }, [email, isClient]);

    // --- Form Submission Logic ---
    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) return;

        setError(null);
        setIsLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success('Logged in successfully!');
            router.push('/play');
        } catch (error: any) {
            handleAuthError(error);
        }
        setIsLoading(false);
    };
    
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth || !firestore) {
          toast.error('Auth service is not available. Please try again later.');
          return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (!displayName) {
            setError("Please enter your name.");
            return;
        }
        setIsLoading(true);

        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
    
          await updateProfile(user, { 
            displayName: displayName,
            photoURL: `https://avatar.vercel.sh/${user.email}.png`
          });
    
          const userDocRef = doc(firestore, 'users', user.uid);
          await setDoc(userDocRef, {
            email: user.email,
            displayName: displayName,
            photoURL: `https://avatar.vercel.sh/${user.email}.png`,
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
    
          toast.success('Account created successfully!');
          router.push('/play');
        } catch (error) {
          handleAuthError(error);
        } finally {
          setIsLoading(false);
        }
      };

    // --- Google Sign-In Logic ---
    const handleGoogleSignIn = async () => {
        if (!auth) return;
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            toast.success('Signed in with Google successfully!');
            router.push('/play');
        } catch (error: any) {
            handleAuthError(error);
        }
    }

    // --- Error Handling ---
    const handleAuthError = (error: any) => {
        console.error("Auth Error:", error);
        let errorMessage = "An unknown error occurred. Please try again.";
        if (error instanceof FirebaseError) {
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = "The email address is not valid.";
                    break;
                case 'auth/invalid-credential':
                case 'auth/wrong-password':
                    errorMessage = "Invalid credentials. Please check your email and password.";
                    break;
                case 'auth/user-not-found':
                    errorMessage = "No account found with this email. Please sign up.";
                    setAuthMode('signup');
                    break;
                case 'auth/popup-closed-by-user':
                    errorMessage = "Sign-in popup closed. Please try again.";
                    break;
                case 'auth/email-already-in-use':
                    errorMessage = "This email is already registered. Please login.";
                    setAuthMode('login');
                    break;
                case 'auth/weak-password':
                    errorMessage = "The password is too weak. Please choose a stronger password.";
                    break;
                default:
                    errorMessage = error.message;
                    break;
            }
        }
        setError(errorMessage);
        toast.error('Authentication Failed', { description: errorMessage });
    };

    const renderFormContent = () => {
        if (!isClient) {
            return <div className="h-48 flex justify-center items-center"><Loader2 className="animate-spin" /></div>
        }

        if (authMode === 'login') {
            return (
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="email" type="email" placeholder="Email address" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="pl-10 h-12 text-base" />
                    </div>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="password" type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="pl-10 h-12 text-base" />
                    </div>
                    <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={isLoading || isCheckingEmail}>
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Login'}
                    </Button>
                </form>
            )
        }

        if (authMode === 'signup') {
            return (
                 <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="email" type="email" placeholder="Email address" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="pl-10 h-12 text-base" />
                    </div>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="displayName" type="text" placeholder="Full Name" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={isLoading} className="pl-10 h-12 text-base" />
                    </div>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="signup-password" type="password" placeholder="Password (min. 6 characters)" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} className="pl-10 h-12 text-base" />
                    </div>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="confirm-password" type="password" placeholder="Confirm Password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} className="pl-10 h-12 text-base" />
                    </div>
                    <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={isLoading || isCheckingEmail}>
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Create Account'}
                    </Button>
                </form>
            )
        }

        // Fallback for when email is not yet valid or mode is 'unknown'
        return (
            <form className="space-y-4">
                 <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="email-initial" type="email" placeholder="Enter your email to continue" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} className="pl-10 h-12 text-base" />
                </div>
                 <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={true}>
                    Continue
                </Button>
            </form>
        )
    }

    return (
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-white/20 animate-fade-in-up">
            <CardHeader className="text-center">
                 <CardTitle className="text-3xl font-bold text-card-foreground">
                    {authMode === 'login' ? 'Welcome Back!' : 'Create an Account'}
                </CardTitle>
                <CardDescription className="text-card-foreground/80">
                    {authMode === 'login' ? 'Sign in to continue to Ludo Arena.' : 'Join the Ludo community and start playing!'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                {renderFormContent()}
                 <div className="relative my-6">
                    <Separator />
                    <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-card px-2 text-sm text-muted-foreground">OR</span>
                </div>
                <Button type="button" variant="outline" size="lg" className="w-full h-12 text-base" onClick={handleGoogleSignIn} disabled={isLoading}>
                    <GoogleIcon className="mr-2"/> Continue with Google
                </Button>
            </CardContent>
            <CardFooter>
                 <div className="text-center text-sm text-card-foreground/80 w-full">
                  {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                  {' '}
                  <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="font-semibold text-primary hover:underline">
                    {authMode === 'login' ? 'Sign up' : 'Login here'}
                  </button>
                </div>
            </CardFooter>
        </Card>
    );
}
