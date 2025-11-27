'use client';

import { usePathname } from 'next/navigation';
import AppLayout from '@/app/(app)/layout';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  const isLandingPage = pathname === '/';
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAuthRoute || isLandingPage || isAdminRoute) {
    return <>{children}</>;
  }

  // Otherwise, render the main app layout
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}
