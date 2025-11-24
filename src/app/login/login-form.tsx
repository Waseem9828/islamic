'use client';

import { useState } from 'react';
import { useFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { auth, functions } = useFirebase();
    const router = useRouter();

    const handleSignIn = async (e: React.FormEvent) => {
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
                // Check for admin status after successful login
                const checkAdmin = httpsCallable(functions, 'checkAdminStatus');
                try {
                    const result = await checkAdmin();
                    const isAdmin = (result.data as { isAdmin: boolean }).isAdmin;
                    
                    if (isAdmin) {
                        router.push('/admin/dashboard');
                    } else {
                        router.push('/dashboard');
                    }
                } catch (adminCheckError) {
                    console.error("Admin check failed:", adminCheckError);
                    // Default to user dashboard if admin check fails
                    router.push('/dashboard');
                }
            } else {
                 // This case should ideally not be reached if signInWithEmailAndPassword succeeds
                 router.push('/dashboard');
            }

        } catch (error: any) {
            console.error("Login Error:", error);
            let errorMessage = "An unknown error occurred. Please try again.";
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = "No account found with this email.";
                    break;
                case 'auth/wrong-password':
                    errorMessage = "Incorrect password. Please try again.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "The email address is not valid.";
                    break;
                default:
                    errorMessage = error.message;
                    break;
            }
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    return (
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          <form onSubmit={handleSignIn} className="grid gap-4">
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
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Login'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </div>
      );
}
