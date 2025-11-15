import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 border-b bg-background shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <ArrowLeft className="h-5 w-5 text-primary cursor-pointer" />
          </Link>
          <h1 className="text-xl font-bold text-primary">Admin Panel</h1>
        </div>
      </header>
      <main className="p-4">
        {children}
      </main>
    </div>
  );
}
