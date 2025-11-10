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
        <div className="text-white">لوڈ ہو رہا ہے...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white bg-opacity-10 border-islamic-gold border-opacity-20 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-arabic text-islamic-gold">
            صارف پروفائل
          </CardTitle>
          <CardDescription className="text-islamic-cream font-urdu">
            آپ کی پروفائل اور ترتیبات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-right">
          <div className="space-y-1">
            <p className="font-urdu text-islamic-cream">ای میل:</p>
            <p className="font-mono text-lg">{user.isAnonymous ? 'مہمان صارف' : user.email}</p>
          </div>
          <div className="space-y-1">
            <p className="font-urdu text-islamic-cream">صارف آئی ڈی:</p>
            <p className="font-mono text-sm opacity-70">{user.uid}</p>
          </div>
           <div className="space-y-1">
            <p className="font-urdu text-islamic-cream">سبسکرپشن:</p>
            <p className="font-urdu text-lg text-islamic-gold">کوئی نہیں</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {isAdmin && (
            <Link href="/admin" className="w-full">
              <Button variant="secondary" className="w-full font-urdu">
                <Shield className="ml-2 h-4 w-4" />
                ایڈمن پینل
              </Button>
            </Link>
          )}
          <Button onClick={handleLogout} variant="destructive" className="w-full font-urdu">
            <LogOut className="ml-2 h-4 w-4" />
            لاگ آؤٹ
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
