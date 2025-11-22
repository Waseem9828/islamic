'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, IndianRupee, Settings, LayoutDashboard, ListChecks, Trophy, History, HardDrive, ArrowLeft, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/deposits', icon: IndianRupee, label: 'Deposits' },
  { href: '/admin/withdrawals', icon: IndianRupee, label: 'Withdrawals' },
  { href: '/admin/match-winnings', icon: Trophy, label: 'Match Winnings' },
  { href: '/admin/rewards', icon: ListChecks, label: 'Rewards' },
  { href: '/admin/transactions', icon: History, label: 'Transactions' },
  { href: '/admin/storage', icon: HardDrive, label: 'Storage' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

const SidebarLink = ({ item, onClick }: { item: typeof navItems[0], onClick: () => void }) => {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link href={item.href} legacyBehavior passHref>
      <a
        onClick={onClick} // Close sidebar on click on mobile
        className={`
          flex items-center p-3 rounded-lg transition-colors
          text-gray-200 hover:bg-gray-700 hover:text-white
          ${isActive ? 'bg-primary text-white' : ''}
        `}
      >
        <item.icon className="w-5 h-5 mr-4" />
        <span className="truncate">{item.label}</span>
      </a>
    </Link>
  );
};

export const AdminSidebar = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (isOpen: boolean) => void; }) => {
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={closeSidebar}
      ></div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 w-64 h-full bg-gray-800 text-white z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:w-20 md:hover:w-64 md:transition-all md:duration-300
          group
        `}
      >
        <div className="flex flex-col h-full">
          <header className="flex items-center justify-between p-4 h-16 border-b border-gray-700 md:justify-center">
            <Link href="/admin" passHref legacyBehavior>
              <a className="flex items-center gap-2 text-xl font-bold text-white">
                <Trophy className="text-primary"/>
                <span className="md:hidden md:group-hover:inline">Admin</span>
              </a>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={closeSidebar}>
                <X className="w-6 h-6" />
            </Button>
          </header>

          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <SidebarLink key={item.href} item={item} onClick={closeSidebar} />
            ))}
          </nav>

          <footer className="p-2 border-t border-gray-700">
             <Link href="/" legacyBehavior passHref>
                <a className="flex items-center p-3 rounded-lg text-gray-200 hover:bg-gray-700 hover:text-white">
                    <ArrowLeft className="w-5 h-5 mr-4" />
                    <span className="truncate">Back to App</span>
                </a>
            </Link>
          </footer>
        </div>
      </aside>
    </>
  );
};
