'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Home,
  Users,
  IndianRupee,
  Settings,
  LayoutDashboard,
  Trophy,
  History,
  HardDrive,
  Wallet,
  FileText,
  PanelLeft,
  ArrowLeft,
} from 'lucide-react';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/deposit-requests', icon: IndianRupee, label: 'Deposits' },
  { href: '/admin/withdrawals', icon: IndianRupee, label: 'Withdrawals' },
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
  onClick,
}: {
  item: typeof navItems[0];
  isExpanded: boolean;
  onClick?: () => void;
}) => {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin');

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`
      flex items-center p-3 my-1 rounded-lg transition-colors
      text-gray-300 hover:bg-gray-700 hover:text-white
      ${isActive ? 'bg-primary text-white' : ''}
      ${!isExpanded ? 'justify-center' : ''}
    `}
    >
      <item.icon className="w-5 h-5" />
      <span
        className={`
        ml-4 transition-all duration-200
        ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}
      `}
      >
        {item.label}
      </span>
    </Link>
  );
};

export const AdminSidebar = () => {
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
            <Link href="/admin" className="flex items-center gap-2 text-xl font-bold text-white">
              <Trophy className="text-primary h-7 w-7" />
              <span className={`transition-opacity ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                Admin
              </span>
            </Link>
          </header>

          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <SidebarLink key={item.href} item={item} isExpanded={isExpanded} />
            ))}
          </nav>

          <footer className="p-2 border-t border-gray-700">
            <Link
              href="/"
              className="flex items-center p-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
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
                        <Link href="/admin" className="flex items-center gap-2 text-xl font-bold text-white">
                            <Trophy className="text-primary h-7 w-7" />
                            <span>Admin</span>
                        </Link>
                    </header>
                    <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                        {navItems.map((item) => (
                            <SidebarLink key={item.href} item={item} isExpanded={true} />
                        ))}
                    </nav>
                     <footer className="p-2 border-t border-gray-700">
                        <SidebarLink item={{href: '/', icon: ArrowLeft, label: 'Back to App'}} isExpanded={true} />
                    </footer>
                </div>
            </SheetContent>
        </Sheet>
      </header>
    </>
  );
};
