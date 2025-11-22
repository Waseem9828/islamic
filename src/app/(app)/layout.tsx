
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
        <div className="min-h-screen bg-muted/20 flex group">
            <AppSidebar />
            <div className="flex-1 flex flex-col transition-all duration-200 ease-in-out md:ml-14 group-data-[state=expanded]:md:ml-64">
                <AppHeader />
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    </SidebarProvider>
  );
}
