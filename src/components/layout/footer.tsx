'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, Landmark, User, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/play', label: 'Play', icon: Swords },
  { href: '/deposit', label: 'Deposit', icon: Wallet },
  { href: '/withdraw', label: 'Withdraw', icon: Landmark },
  { href: '/profile', label: 'Profile', icon: User },
];

const Footer = () => {
  const pathname = usePathname();
  
  if (pathname.startsWith('/admin')) {
    return null;
  }


  return (
    <footer className="sticky bottom-0 z-50 bg-background/95 border-t backdrop-blur-sm md:hidden">
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
