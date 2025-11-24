'use client';

import { usePathname } from 'next/navigation';
import AppHeader from './AppHeader';
import Footer from './footer';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if the current route is an admin route
  const isAdminRoute = pathname.startsWith('/admin');

  // Routes where the main layout (header, bottom nav) should be hidden
  const noLayoutRoutes = ['/login', '/signup', '/'];

  // If the current path is one of the no-layout routes or an admin route, just render the children
  if (noLayoutRoutes.includes(pathname) || isAdminRoute) {
    return <>{children}</>;
  }

  // Otherwise, render the full client layout
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
