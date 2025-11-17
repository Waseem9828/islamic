
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
        <div className="min-h-screen bg-muted/30">
        <AdminSidebar />
        <div className="md:pl-12 group-data-[collapsible=icon]:md:pl-[3rem] transition-all duration-200 ease-in-out">
            <AdminHeader />
            <main>{children}</main>
        </div>
        </div>
    </SidebarProvider>
  );
}
