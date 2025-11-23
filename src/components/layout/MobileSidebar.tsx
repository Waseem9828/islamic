'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, Trophy, HelpCircle, Shield, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/deposit', icon: Wallet, label: 'Deposit' },
  { href: '/withdraw', icon: Wallet, label: 'Withdraw' },
  { href: '/games', icon: Trophy, label: 'Games' },
  { href: '/support', icon: HelpCircle, label: 'Support' },
  { href: '/privacy', icon: Shield, label: 'Privacy Policy' },
];

const SidebarLink = ({ href, icon: Icon, label, onClick }: typeof navItems[0] & { onClick: () => void }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} onClick={onClick} className={`flex items-center p-3 rounded-lg transition-colors text-gray-200 hover:bg-gray-700 hover:text-white ${isActive ? 'bg-primary text-white' : ''}`}>

      <Icon className="w-5 h-5 mr-4" />
      <span className="truncate">{label}</span>

    </Link>
  );
};

export const MobileSidebar = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (isOpen: boolean) => void; }) => {
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-60 z-50 md:hidden ${isOpen ? 'block' : 'hidden'}`}
        onClick={closeSidebar}
      ></div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 w-64 h-full bg-gray-800 text-white z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden`}>
        <div className="flex flex-col h-full">
          <header className="flex items-center justify-between p-4 h-16 border-b border-gray-700">
             <h2 className="text-xl font-bold">Menu</h2>
            <Button variant="ghost" size="icon" onClick={closeSidebar}>
                <X className="w-6 h-6" />
            </Button>
          </header>

          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <SidebarLink key={item.href} {...item} onClick={closeSidebar} />
            ))}
          </nav>
          
        </div>
      </aside>
    </>
  );
};
