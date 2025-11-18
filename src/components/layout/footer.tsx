
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Landmark, User, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/matchmaking', label: 'Home', icon: Home },
  { href: '/play', label: 'Play', icon: Swords },
  { href: '/wallet', label: 'Wallet', icon: Landmark },
  { href: '/profile', label: 'Profile', icon: User },
];

const Footer = () => {
  const pathname = usePathname();
  
  const hiddenRoutes = ['/admin', '/login', '/signup', '/'];
  if (hiddenRoutes.some(p => pathname.startsWith(p) && (p !== '/' || pathname === '/'))) {
    return null;
  }


  return (
    <footer className="sticky bottom-0 z-50 bg-muted border-t backdrop-blur-sm md:hidden">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link href={item.href} key={item.label} className="flex-1">
              <div
                className={cn(
                  'flex flex-col items-center justify-center gap-1 h-full text-sm font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-primary'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
};

export default Footer;

    
