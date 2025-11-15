'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/firebase';
import {
  initiateEmailSignUp,
  initiateEmailSignIn,
} from '@/firebase/non-blocking-login';
import { toast } from 'sonner';
import { FirebaseError } from 'firebase/app';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const auth = useAuth();

  const handleAuthAction = (action: (auth: any, email: any, password: any, callback: any) => void, successMessage: string) => {
    if (!auth) {
      toast.error('Auth service is not available. Please try again later.');
      return;
    }
    action(auth, email, password, (error?: FirebaseError) => {
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(successMessage);
        router.push('/');
      }
    });
  };

  const handleLogin = () => {
    handleAuthAction(initiateEmailSignIn, 'Logged in successfully');
  };

  const handleSignUp = () => {
    handleAuthAction(initiateEmailSignUp, 'Signed up successfully');
  };

  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login or Sign Up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleLogin} className="w-full">Login</Button>
            <Button onClick={handleSignUp} className="w-full" variant="outline">Sign Up</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
