'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/hooks/useAdmin';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isAdminLoading } = useAdmin();
  const { isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    const isAuthenticating = isAdminLoading || isUserLoading;
    if (isAuthenticating) {
      // Wait for the admin and user status to be determined
      return;
    }

    if (!isAdmin) {
      // If not an admin, redirect to the matchmaking page
      router.replace('/matchmaking');
    }
  }, [isAdmin, isAdminLoading, isUserLoading, router]);

  const isLoading = isAdminLoading || isUserLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-semibold text-muted-foreground">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return <>{children}</>;
  }

  // Render nothing while redirecting
  return null;
}
