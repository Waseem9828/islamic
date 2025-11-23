'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { BottomNav } from '@/components/layout/BottomNav';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Add padding to the bottom of the content to avoid overlap with BottomNav */}
      <div className="h-16 md:hidden" /> 

      <BottomNav />
    </div>
  );
}
