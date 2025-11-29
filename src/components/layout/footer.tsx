'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Landmark, User, Swords, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

const Footer = () => {
  const pathname = usePathname();
  const { user } = useUser();
  
  const navItems = [
    { href: '/matchmaking', label: 'Play', icon: Swords },
    { href: '/leaderboard', label: 'Ranks', icon: Trophy },
    { href: '/wallet', label: 'Wallet', icon: Landmark },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  const hiddenRoutes = ['/admin', '/login', '/signup', '/'];
  if (hiddenRoutes.some(p => pathname.startsWith(p) && (p !== '/' || pathname === '/'))) {
    return null;
  }
  
  if (!user) {
    return null;
  }

  return (
    <footer className="sticky bottom-0 z-50 bg-background/95 border-t backdrop-blur-sm md:hidden">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/matchmaking' && pathname.startsWith('/match/'));
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
