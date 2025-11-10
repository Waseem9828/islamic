'use client';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dice5, Target, Users } from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/hooks/use-admin';

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const { isAdmin, isAdminLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !isAdminLoading) {
      if (!user || !isAdmin) {
        router.push('/');
      }
    }
  }, [user, isUserLoading, isAdmin, isAdminLoading, router]);

  if (isUserLoading || isAdminLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white">ایڈمن لوڈ ہو رہا ہے...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white">رسائی ممنوع ہے۔</div>
      </div>
    );
  }

  const adminFeatures = [
    {
      title: 'قرعہ اندازی',
      description: 'نئے قرعے بنائیں اور ان کا نظم کریں۔',
      href: '/draw',
      icon: <Dice5 className="w-8 h-8 text-islamic-gold" />,
    },
    {
      title: 'خاص انتخاب',
      description: 'مخصوص نمبر منتخب کرنے کے خصوصی طریقے',
      href: '/exact-selection',
      icon: <Target className="w-8 h-8 text-islamic-gold" />,
    },
    {
      title: 'کمیونٹی',
      description: 'گروپس اور لیڈر بورڈ کا نظم کریں۔',
      href: '/community',
      icon: <Users className="w-8 h-8 text-islamic-gold" />,
    },
  ];

  return (
    <main className="flex flex-col items-center justify-center p-4">
      <div className="text-center z-10 max-w-4xl mx-auto w-full">
        <header className="mb-12">
          <h1 className="text-4xl md:text-6xl font-arabic text-islamic-gold mb-6 leading-tight">
            ایڈمن ڈیش بورڈ
          </h1>
          <p className="text-xl md:text-2xl font-urdu text-white mb-4">
            خوش آمدید, ایڈمن
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {adminFeatures.map((feature) => (
            <Link href={feature.href} key={feature.title}>
                <Card className="bg-white bg-opacity-10 border-islamic-gold border-opacity-20 text-white text-right h-full hover:bg-opacity-20 transition-all cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      {feature.icon}
                      <CardTitle className="font-urdu text-islamic-gold">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="font-urdu text-islamic-cream">{feature.description}</p>
                  </CardContent>
                </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
