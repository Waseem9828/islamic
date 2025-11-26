
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

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
                // Check for admin status by calling the cloud function
                const checkAdmin = httpsCallable(functions, 'checkAdminStatus');
                const result = await checkAdmin();
                const isAdmin = (result.data as { isAdmin: boolean }).isAdmin;

                if (isAdmin) {
                    router.push('/admin');
                } else {
                    router.push('/matchmaking');
                }
            } else {
                 router.push('/matchmaking');
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
                 case 'auth/invalid-credential':
                    errorMessage = "Invalid credentials. Please check your email and password.";
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
        <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
                <CardDescription>Enter your email below to login to your account.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            suppressHydrationWarning
                        />
                    </div>
                    <div className="space-y-2">
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
                            suppressHydrationWarning
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full" disabled={isLoading} suppressHydrationWarning>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Login'}
                    </Button>
                    <div className="text-center text-sm">
                        Don't have an account?{" "}
                        <Link href="/signup" className="underline font-semibold">
                            Sign up
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
      );
}
