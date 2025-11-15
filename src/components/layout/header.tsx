'use client';

import React from 'react';
import { Button } from '../ui/button';
import { Bell, Menu } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/firebase';

const Header = () => {
  const pathname = usePathname();
  const { user } = useUser();
  
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 border-b bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden">
          <Menu />
        </SidebarTrigger>
        <Link href="/">
          <h1 className="text-xl font-bold text-primary">Premium Numbers</h1>
        </Link>
      </div>

      <nav className="hidden md:flex items-center gap-4">
        <Link href="/subscriptions" className="text-sm font-medium text-muted-foreground hover:text-primary">Subscriptions</Link>
        <Link href="/deposit" className="text-sm font-medium text-muted-foreground hover:text-primary">Deposit</Link>
        <Link href="/wallet" className="text-sm font-medium text-muted-foreground hover:text-primary">Wallet</Link>
      </nav>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        {!user && <Button asChild size="sm" variant="outline"><Link href="/login">Login</Link></Button>}
      </div>
    </header>
  );
};

export default Header;
