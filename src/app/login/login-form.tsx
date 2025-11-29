'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase/client-provider';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    GoogleAuthProvider, 
    signInWithPopup, 
    fetchSignInMethodsForEmail, 
    updateProfile
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

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
    const { auth } = useFirebase();
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
        if (email && isClient) {
            debouncedCheckEmail(email);
        }
    }, [email, isClient]);

    // --- Form Submission Logic ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) return;

        setError(null);
        setIsLoading(true);

        if (authMode === 'signup') {
            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                setIsLoading(false);
                return;
            }
            if (!displayName) {
                setError("Please enter your name.");
                setIsLoading(false);
                return;
            }
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName });
                toast.success('Account created successfully!');
                router.push('/play');
            } catch (error: any) {
                handleAuthError(error);
            }

        } else {
            try {
                await signInWithEmailAndPassword(auth, email, password);
                toast.success('Logged in successfully!');
                router.push('/play');
            } catch (error: any) {
                handleAuthError(error);
            }
        }

        setIsLoading(false);
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
                    errorMessage = "Invalid credentials. Please check your email and password.";
                    if (authMode === 'login') {
                        fetchSignInMethodsForEmail(auth!, email).then(methods => {
                            if (methods.includes('google.com')) {
                                setError('This email is registered with Google. Please use the "Continue with Google" button.');
                            }
                        });
                    }
                    break;
                case 'auth/popup-closed-by-user':
                    errorMessage = "Sign-in popup closed. Please try again.";
                    break;
                case 'auth/email-already-in-use':
                    errorMessage = "This email is already in use by another account.";
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

    const renderButtonContent = () => {
        if (!isClient || isLoading || isCheckingEmail) {
            return 'Loading...';
        }
        if (authMode === 'signup') {
            return 'Sign Up';
        }
        return 'Login';
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            {isClient && authMode === 'signup' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Your Name</Label>
                        <Input
                            id="displayName"
                            type="text"
                            placeholder="John Doe"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </>
            )}

            {isClient && authMode !== 'unknown' && (
                 <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            )}

            <Button type="submit" className="w-full" disabled={!isClient || isLoading || isCheckingEmail || authMode === 'unknown'}>
                {renderButtonContent()}
            </Button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>

            <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                Continue with Google
            </Button>
        </form>
    );
}
