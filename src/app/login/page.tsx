'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSignIn = () => {
    // Simulate login
    router.push('/');
  };

  return (
    <main className="flex flex-col items-center justify-center flex-grow p-4 sm:p-6">
      <Card className="w-full max-w-sm bg-muted/30">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login or Sign Up</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            />
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleSignIn}
              className="w-full"
              disabled={!email || !password}
            >
              Login
            </Button>
            <Button
              onClick={handleSignIn}
              variant="outline"
              className="w-full"
              disabled={!email || !password}
            >
              Sign Up
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
