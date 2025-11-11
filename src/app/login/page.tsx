'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { setDocumentNonBlocking } from '@/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const auth = getAuth();
    const firestore = getFirestore();

    try {
      if (isSigningUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        
        // Create user document in Firestore
        if (newUser) {
          const userDocRef = doc(firestore, 'users', newUser.uid);
          setDocumentNonBlocking(userDocRef, {
            id: newUser.uid,
            email: newUser.email,
            username: newUser.email?.split('@')[0] || 'user',
          }, {});
        }
        
        toast({ title: 'Success!', description: 'Your account has been created.' });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Welcome Back!', description: 'You have successfully logged in.' });
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message);
      toast({ variant: 'destructive', title: 'Error', description: 'There was a problem with login or sign up.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    setError(null);
    const auth = getAuth();
    const firestore = getFirestore();
    try {
      const userCredential = await signInAnonymously(auth);
      const newUser = userCredential.user;

      if (newUser) {
        const userDocRef = doc(firestore, 'users', newUser.uid);
        setDocumentNonBlocking(userDocRef, {
            id: newUser.uid,
            email: null,
            username: 'guest_user',
          }, { merge: true });
      }

      toast({ title: 'Welcome!', description: 'You are logged in as a guest.' });
      router.push('/');
    } catch (err: any) {
      setError(err.message);
      toast({ variant: 'destructive', title: 'Error', description: 'There was a problem with guest login.' });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
       <Card className="w-full max-w-md bg-white bg-opacity-10 border-islamic-gold border-opacity-20 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-islamic-gold">
            {isSigningUp ? 'Create an Account' : 'Login'}
          </CardTitle>
          <CardDescription className="text-islamic-cream">
            {isSigningUp ? 'Enter your details to continue.' : 'Log in to your account.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuthAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white bg-opacity-20 border-white border-opacity-30 text-white placeholder-gray-400"
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white bg-opacity-20 border-white border-opacity-30 text-white placeholder-gray-400"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-accent text-accent-foreground font-bold" disabled={loading}>
              {loading ? 'Please wait...' : (isSigningUp ? 'Sign Up' : 'Login')}
            </Button>
            <Button variant="outline" type="button" className="w-full" onClick={() => setIsSigningUp(!isSigningUp)}>
              {isSigningUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </Button>
             <div className="relative w-full flex items-center justify-center my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white border-opacity-30"></span>
              </div>
              <span className="relative px-2 bg-background text-xs uppercase text-islamic-cream">Or</span>
            </div>
             <Button variant="secondary" type="button" className="w-full" onClick={handleAnonymousSignIn} disabled={loading}>
              {loading ? 'Please wait...' : 'Continue as Guest'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
