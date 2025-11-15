'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';

export default function Home() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <p>Loading...</p>
      </main>
    );
  }

  if (user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold">Welcome to your Dashboard!</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          You are logged in as {user.email || 'a guest'}.
        </p>
      </main>
    );
  }

  return null;
}
