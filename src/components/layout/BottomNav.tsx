'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, Trophy, User } from 'lucide-react';
import { useUser } from '@/firebase';

const navItems = [
  { href: '/matchmaking', icon: Home, label: 'Home' },
  { href: '/deposit', icon: Wallet, label: 'Deposit' },
  { href: '/games', icon: Trophy, label: 'Games' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export const BottomNav = () => {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  // Paths to hide the navigation on
  const pathsToHideOn = ['/', '/login', '/signup'];

  // Hide on specified paths, or if the user is loading or not logged in
  if (pathsToHideOn.includes(pathname) || isUserLoading || !user) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-t-lg">
      <div className="grid grid-cols-4 max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link href={href} key={href} className="flex flex-col items-center justify-center p-2 text-center text-gray-600 hover:bg-gray-100">
                <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-primary' : ''}`} />
                <span className={`text-xs ${isActive ? 'text-primary font-semibold' : ''}`}>
                  {label}
                </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
