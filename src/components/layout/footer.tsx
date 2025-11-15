'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gem, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/subscriptions', label: 'Subscriptions', icon: Gem },
  { href: '/profile', label: 'Profile', icon: User },
];

const Footer = () => {
  const pathname = usePathname();

  return (
    <footer className="sticky bottom-0 z-50 bg-background border-t">
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
                <item.icon className="h-6 w-6" />
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
