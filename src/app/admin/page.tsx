'use client';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <div>Loading Admin...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Access Denied.</div>
      </div>
    );
  }

  const adminFeatures = [
    {
      title: 'Draws',
      description: 'Create and manage new draws.',
      href: '/draw',
      icon: <Dice5 className="w-8 h-8 text-primary" />,
    },
    {
      title: 'Exact Selection',
      description: 'Special methods for selecting specific numbers.',
      href: '/exact-selection',
      icon: <Target className="w-8 h-8 text-primary" />,
    },
    {
      title: 'Community',
      description: 'Manage groups and leaderboards.',
      href: '/community',
      icon: <Users className="w-8 h-8 text-primary" />,
    },
  ];

  return (
    <main className="flex flex-col items-center justify-center p-4">
      <div className="text-center z-10 max-w-4xl mx-auto w-full">
        <header className="mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6 leading-tight">
            Admin Dashboard
          </h1>
          <p className="text-xl md:text-2xl text-foreground mb-4">
            Welcome, Admin
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {adminFeatures.map((feature) => (
            <Link href={feature.href} key={feature.title}>
                <Card className="text-left h-full hover:bg-accent transition-all cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      {feature.icon}
                      <CardTitle className="text-primary">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
