'use client';

import Link from 'next/link';
import { useUser } from '@/firebase';
import { Bell, User, Menu, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { user, userData } = useUser();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 bg-primary text-white shadow-lg">
      {/* Left side: Hamburger Menu (mobile) and Logo */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden hover:bg-white/20"
          onClick={onMenuClick}
        >
          <Menu className="w-6 h-6" />
        </Button>
        <Link href="/" className="text-xl font-bold">
          Premium Numbers
        </Link>
      </div>
      {/* Right side: Balance, Notifications, Profile */}
      <div className="flex items-center gap-3 md:gap-4">
        {user && (
          <div className="flex items-center gap-2 p-2 bg-black/20 rounded-md">
            <Wallet className="w-5 h-5" />
            <span className="text-sm font-semibold">
              ₹{userData?.balance?.toFixed(2) ?? '0.00'}
            </span>
          </div>
        )}
        <Link href="/notifications" className="p-2 rounded-full hover:bg-white/20">

          <Bell className="w-6 h-6" />

        </Link>
        <Link href="/profile" className="p-2 rounded-full hover:bg-white/20">

          <User className="w-6 h-6" />

        </Link>
      </div>
    </header>
  );
};
