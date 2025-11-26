'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Don't make any decisions while the user state is still loading.
    if (isUserLoading) {
      return;
    }

    // Once loading is complete, check for admin status.
    // If the user object doesn't exist or the 'admin' flag is not true, redirect.
    if (!user || !user.admin) {
      toast.error('You do not have permission to access this page.');
      router.replace('/');
    }
  }, [isUserLoading, user, router]);

  // Conditions to show the loader:
  // 1. The user/admin status is still being determined.
  // 2. The user is not an admin, and we are waiting for the redirect to happen.
  if (isUserLoading || !user || !user.admin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is complete and the user is a verified admin, render the protected page.
  return <>{children}</>;
}
