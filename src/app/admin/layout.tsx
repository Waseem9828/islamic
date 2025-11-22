
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminHeader from '@/components/layout/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
        <div className="min-h-screen bg-muted/20">
        <AdminSidebar />
        <div className="transition-all duration-200 ease-in-out md:pl-14 group-data-[state=expanded]:md:pl-64">
            <AdminHeader />
            <main>{children}</main>
        </div>
        </div>
    </SidebarProvider>
  );
}
