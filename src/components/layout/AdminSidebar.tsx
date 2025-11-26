
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Users,
  IndianRupee,
  Trophy,
  History,
  FileText,
  HardDrive,
  Wallet,
  Settings,
  PanelLeft,
  ArrowLeft,
} from 'lucide-react';
import { Badge } from '../ui/badge';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/deposit-requests', icon: IndianRupee, label: 'Deposits', countKey: 'deposits' },
  { href: '/admin/withdrawals', icon: IndianRupee, label: 'Withdrawals', countKey: 'withdrawals' },
  { href: '/admin/matches', icon: Trophy, label: 'Matches' },
  { href: '/admin/transactions', icon: History, label: 'Transactions' },
  { href: '/admin/landing-page', icon: FileText, label: 'Landing Page' },
  { href: '/admin/storage', icon: HardDrive, label: 'Storage' },
  { href: '/admin/payment-settings', icon: Wallet, label: 'Payment Settings' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

const SidebarLink = ({
  item,
  isExpanded,
  count,
  onClick,
}: {
  item: typeof navItems[0];
  isExpanded: boolean;
  count?: number;
  onClick?: () => void;
}) => {
  const pathname = usePathname();
  const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin/dashboard');

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`
        flex items-center p-3 my-1 rounded-lg transition-colors relative
        text-gray-300 hover:bg-gray-700 hover:text-white
        ${isActive ? 'bg-primary text-white' : ''}
        ${!isExpanded ? 'justify-center' : ''}
      `}
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      <span
        className={`
          ml-4 transition-opacity duration-200
          ${isExpanded ? 'opacity-100 flex-1' : 'opacity-0 w-0'}
        `}
      >
        {item.label}
      </span>
      {count && count > 0 && (
          <Badge className={`
            transition-all duration-200
            ${isExpanded ? 'ml-auto' : 'absolute top-1 right-1 h-5 w-5 p-0 justify-center text-xs'}
          `}>
            {count}
          </Badge>
      )}
    </Link>
  );
};

interface AdminSidebarProps {
    notificationCounts: {
        deposits: number;
        withdrawals: number;
    }
}

export const AdminSidebar = ({ notificationCounts }: AdminSidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden md:flex flex-col fixed top-0 left-0 h-full bg-gray-800 text-white
          transition-all duration-300 ease-in-out z-50
        `}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        style={{ width: isExpanded ? '16rem' : '4.5rem' }}
      >
        <div className="flex flex-col h-full">
          <header className="flex items-center justify-center p-4 h-16 border-b border-gray-700">
            <Link href="/admin/dashboard" className="flex items-center gap-2 text-xl font-bold text-white">
              <Trophy className="text-primary h-7 w-7" />
              <span className={`transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                Admin
              </span>
            </Link>
          </header>

          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <SidebarLink 
                key={item.href} 
                item={item} 
                isExpanded={isExpanded} 
                count={item.countKey ? notificationCounts[item.countKey as keyof typeof notificationCounts] : undefined}
              />
            ))}
          </nav>

          <footer className="p-2 border-t border-gray-700 mt-auto">
            <Link
              href="/"
              className="flex items-center p-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 flex-shrink-0" />
              <span className={`ml-4 transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                Back to App
              </span>
            </Link>
          </footer>
        </div>
      </aside>

      {/* Mobile Header & Sidebar */}
      <header className="md:hidden sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
         <Sheet>
            <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs bg-gray-800 text-white p-0">
                 <div className="flex flex-col h-full">
                    <header className="flex items-center justify-center p-4 h-16 border-b border-gray-700">
                        <Link href="/admin/dashboard" className="flex items-center gap-2 text-xl font-bold text-white">
                            <Trophy className="text-primary h-7 w-7" />
                            <span>Admin</span>
                        </Link>
                    </header>
                    <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                        {navItems.map((item) => (
                            <SidebarLink 
                                key={item.href} 
                                item={item} 
                                isExpanded={true} 
                                count={item.countKey ? notificationCounts[item.countKey as keyof typeof notificationCounts] : undefined}
                            />
                        ))}
                    </nav>
                     <footer className="p-2 border-t border-gray-700 mt-auto">
                        <SidebarLink item={{href: '/', icon: ArrowLeft, label: 'Back to App'}} isExpanded={true} />
                    </footer>
                </div>
            </SheetContent>
        </Sheet>
      </header>
    </>
  );
};
