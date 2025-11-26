
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Home,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


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

interface AdminSidebarProps {
    notificationCounts: {
        deposits: number;
        withdrawals: number;
    }
}

export const AdminSidebar = ({ notificationCounts }: AdminSidebarProps) => {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <Link href="/" className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base">
                <Home className="h-4 w-4 transition-all group-hover:scale-110" />
                <span className="sr-only">Ludo App</span>
            </Link>
            <TooltipProvider>
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const count = item.countKey ? notificationCounts[item.countKey as keyof typeof notificationCounts] : 0;
                    return (
                        <Tooltip key={item.href}>
                            <TooltipTrigger asChild>
                                <Link
                                    href={item.href}
                                    className={`relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${isActive ? 'bg-accent text-accent-foreground' : ''}`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {count > 0 && <Badge className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{count}</Badge>}
                                    <span className="sr-only">{item.label}</span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                    )
                })}
            </TooltipProvider>
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
            <TooltipProvider>
                 <Tooltip>
                    <TooltipTrigger asChild>
                    <Link
                        href="/settings"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                    >
                        <Settings className="h-5 w-5" />
                        <span className="sr-only">Settings</span>
                    </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">Settings</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </nav>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
         <Sheet>
            <SheetTrigger asChild>
                <Button size="icon" variant="outline" className="sm:hidden">
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs bg-background p-0">
                <nav className="grid gap-6 text-lg font-medium p-4">
                    <Link href="/" className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base">
                        <Home className="h-5 w-5 transition-all group-hover:scale-110" />
                        <span className="sr-only">Ludo App</span>
                    </Link>
                     {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        const count = item.countKey ? notificationCounts[item.countKey as keyof typeof notificationCounts] : 0;
                        return (
                            <Link key={item.href} href={item.href} className={`flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground ${isActive ? 'text-foreground' : ''}`}>
                                <item.icon className="h-5 w-5" />
                                {item.label}
                                {count > 0 && <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">{count}</Badge>}
                            </Link>
                        )
                    })}
                </nav>
            </SheetContent>
        </Sheet>
      </header>
    </>
  );
};
