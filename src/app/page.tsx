'use client';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white">لوڈ ہو رہا ہے...</div>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center p-4">
      <div className="text-center z-10 max-w-4xl mx-auto w-full">
        <header className="mb-12">
          <h1 className="text-4xl md:text-6xl font-arabic text-islamic-gold mb-6 leading-tight">
            صارف ڈیش بورڈ
          </h1>
          <p className="text-xl md:text-2xl font-urdu text-white mb-4">
            خوش آمدید, {user.isAnonymous ? 'مہمان' : user.email}
          </p>
        </header>

        <Card className="bg-white bg-opacity-10 border-islamic-gold border-opacity-20 text-white">
          <CardHeader>
            <CardTitle className="font-urdu text-islamic-gold">تازہ ترین قرعہ اندازی</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-urdu">یہاں تازہ ترین قرعہ اندازی کے نتائج دکھائے جائیں گے۔</p>
            {/* Placeholder for results */}
            <div className="mt-4 p-4 border-2 border-dashed border-islamic-gold rounded-xl">
              <p className="text-islamic-cream">ابھی کوئی نتیجہ دستیاب نہیں ہے۔</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
