'use client';

import { useState } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { usePathname } from 'next/navigation';
import AdminAuthGuard from '@/components/auth/AdminAuthGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Simple check if it's the login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-gray-100">
        <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="md:pl-20 transition-all duration-300 ease-in-out">
            <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
            <main className="p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
