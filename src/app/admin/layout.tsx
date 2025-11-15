
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminHeader from '@/components/layout/AdminHeader';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
