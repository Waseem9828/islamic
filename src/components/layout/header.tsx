
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Bell, Menu } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/firebase';
import { Skeleton } from '../ui/skeleton';

const Header = () => {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (pathname.startsWith('/admin') || pathname === '/') {
    return null;
  }

  if (!isClient) {
    return (
        <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                 <Skeleton className="h-8 w-8 md:hidden" />
                 <Skeleton className="h-6 w-36" />
            </div>
            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-9 w-20" />
            </div>
        </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden">
          <Menu />
        </SidebarTrigger>
        <Link href="/">
          <h1 className="text-xl font-bold text-primary">Premium Numbers</h1>
        </Link>
      </div>

      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <Link href="/wallet" className="text-muted-foreground hover:text-primary transition-colors">Wallet</Link>
      </nav>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        {isUserLoading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          !user && <Button asChild size="sm"><Link href="/login">Login</Link></Button>
        )}
      </div>
    </header>
  );
};

export default Header;
