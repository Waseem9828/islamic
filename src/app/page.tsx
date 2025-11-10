'use client';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useGroups } from '@/hooks/use-groups';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { groups, isLoading: areGroupsLoading } = useGroups();


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user || areGroupsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white">لوڈ ہو رہا ہے...</div>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center p-4">
      <div className="text-center z-10 max-w-5xl mx-auto w-full">
        <header className="mb-12">
          <h1 className="text-4xl md:text-6xl font-arabic text-islamic-gold mb-6 leading-tight">
            صارف ڈیش بورڈ
          </h1>
          <p className="text-xl md:text-2xl font-urdu text-white mb-4">
            خوش آمدید, {user.isAnonymous ? 'مہمان' : user.email}
          </p>
          <p className="text-islamic-cream font-urdu">یہاں تمام گروپس کے تازہ ترین نتائج دیکھیں۔</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {groups.map((group) => (
                <Card key={group.id} className="bg-white bg-opacity-10 border-islamic-gold border-opacity-20 text-white text-right">
                <CardHeader>
                    <CardTitle className="font-urdu text-islamic-gold text-2xl">{group.name}</CardTitle>
                    <CardDescription className="text-islamic-cream">آخری نتیجہ: ابھی آیا</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Placeholder for results */}
                     <div className="flex justify-center gap-2">
                        <div className="bg-islamic-gold text-islamic-dark w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">12</div>
                        <div className="bg-islamic-gold text-islamic-dark w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">45</div>
                        <div className="bg-islamic-gold text-islamic-dark w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">78</div>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-xs text-islamic-cream opacity-70">نتیجہ 5 منٹ پہلے اپ ڈیٹ ہوا</p>
                    </div>
                </CardContent>
                </Card>
            ))}
        </div>

        {groups.length === 0 && (
            <div className="mt-8">
                <Card className="bg-white bg-opacity-10 border-islamic-gold border-opacity-20 text-white">
                <CardHeader>
                    <CardTitle className="font-urdu text-islamic-gold">تازہ ترین قرعہ اندازی</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mt-4 p-4 border-2 border-dashed border-islamic-gold rounded-xl">
                    <p className="text-islamic-cream">ابھی کوئی نتیجہ دستیاب نہیں ہے۔</p>
                    </div>
                </CardContent>
                </Card>
            </div>
        )}

      </div>
    </main>
  );
}
