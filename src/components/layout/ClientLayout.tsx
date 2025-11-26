'use client';

import { usePathname } from 'next/navigation';
import BottomNavbar from '../BottomNavbar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith('/admin');
  const noLayoutRoutes = ['/login', '/signup', '/'];

  if (noLayoutRoutes.includes(pathname) || isAdminRoute) {
    return <>{children}</>;
  }

  // Otherwise, render the app layout with bottom navbar
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 w-full pb-16">
        {children}
      </main>
      <BottomNavbar />
    </div>
  );
}
