
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
        <div className="min-h-screen bg-muted/20 flex">
            <AdminSidebar />
            <div className="flex-1 flex flex-col transition-all duration-200 ease-in-out md:ml-14 group-data-[state=expanded]:md:ml-64">
                <AdminHeader />
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    </SidebarProvider>
  );
}
