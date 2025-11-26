'use client';

import AppHeader from '@/components/layout/AppHeader';
import AppSidebar from '@/components/layout/AppSidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <AppHeader />
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
