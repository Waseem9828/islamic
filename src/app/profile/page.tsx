'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { useUser } from '@/firebase';
import { useAdmin } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Shield } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const { isAdmin, isAdminLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/login');
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white bg-opacity-10 border-islamic-gold border-opacity-20 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-islamic-gold">
            User Profile
          </CardTitle>
          <CardDescription className="text-islamic-cream">
            Your profile and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-left">
          <div className="space-y-1">
            <p className="text-islamic-cream">Email:</p>
            <p className="font-mono text-lg">{user.isAnonymous ? 'Guest User' : user.email}</p>
          </div>
          <div className="space-y-1">
            <p className="text-islamic-cream">User ID:</p>
            <p className="font-mono text-sm opacity-70">{user.uid}</p>
          </div>
           <div className="space-y-1">
            <p className="text-islamic-cream">Subscription:</p>
            <p className="text-lg text-islamic-gold">None</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {isAdmin && (
            <Link href="/admin" className="w-full">
              <Button variant="secondary" className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Admin Panel
              </Button>
            </Link>
          )}
          <Button onClick={handleLogout} variant="destructive" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
