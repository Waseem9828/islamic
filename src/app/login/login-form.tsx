
'use client';

import { useState } from 'react';
import { useFirebase } from '@/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, KeyRound, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FirebaseError } from 'firebase/app';

// A simple SVG for the Google icon
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.242,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);


export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { auth, functions } = useFirebase();
    const router = useRouter();

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!auth || !functions) {
            setError("Firebase is not initialized. Please try again later.");
            setIsLoading(false);
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (user) {
                const checkAdmin = httpsCallable(functions, 'checkAdminStatus');
                const result = await checkAdmin();
                const isAdmin = (result.data as { isAdmin: boolean }).isAdmin;

                if (isAdmin) {
                    router.push('/admin');
                } else {
                    router.push('/play');
                }
            } else {
                 router.push('/play');
            }

        } catch (error: any) {
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
            router.push('/play');
        } catch (error: any) {
            handleAuthError(error);
        }
    }
    
    const handleAuthError = (error: any) => {
        console.error("Auth Error:", error);
        let errorMessage = "An unknown error occurred. Please try again.";
        if (error instanceof FirebaseError) {
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = "No account found with this email. Please sign up.";
                    break;
                case 'auth/wrong-password':
                    errorMessage = "Incorrect password. Please try again.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "The email address is not valid.";
                    break;
                 case 'auth/invalid-credential':
                    errorMessage = "Invalid credentials. Please check your email and password.";
                    break;
                case 'auth/popup-closed-by-user':
                    errorMessage = "Sign-in popup closed. Please try again.";
                    break;
                default:
                    errorMessage = error.message;
                    break;
            }
        }
        setError(errorMessage);
    }

    return (
        <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-white/20 animate-fade-in-up">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-card-foreground">Welcome Back!</CardTitle>
                <CardDescription className="text-card-foreground/80">Sign in to enter the Ludo arena.</CardDescription>
            </CardHeader>
            <form onSubmit={handleEmailSignIn}>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
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
                                placeholder="Password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                className="pl-10 h-12 text-base"
                            />
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-300">
                             <AlertDescription className="text-center">{error}</AlertDescription>
                        </Alert>
                    )}
                    
                    <Button type="submit" size="lg" className="w-full h-12 text-base" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                    </Button>
                    
                    <div className="relative">
                        <Separator />
                        <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-card px-2 text-sm text-muted-foreground">OR</span>
                    </div>

                     <Button type="button" variant="outline" size="lg" className="w-full h-12 text-base" onClick={handleGoogleSignIn} disabled={isLoading}>
                        <GoogleIcon className="mr-2"/> Sign in with Google
                    </Button>

                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <div className="text-center text-sm text-card-foreground/80">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="font-semibold text-primary hover:underline">
                            Sign up here
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
      );
}
