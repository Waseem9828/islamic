
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home, Gamepad, Trophy, Shield, LogOut, LucideIcon } from 'lucide-react';
import { useFirebase } from '@/firebase';

interface NavItem {
  href: string;
  icon: LucideIcon;
  text: string;
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, text: 'Home' },
  { href: '/matchmaking', icon: Gamepad, text: 'Play' },
  { href: '/leaderboard', icon: Trophy, text: 'Leaderboard' },
  { href: '/support', icon: Shield, text: 'Support' },
];

const AppSidebar = () => {
  const pathname = usePathname();
  const { auth } = useFirebase();

  const handleLogout = () => {
    if (auth) {
      auth.signOut();
    }
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader>
          <h2 className="text-lg font-semibold text-center group-data-[collapsible=icon]:hidden">
            Ludo App
          </h2>
        </SidebarHeader>
        <SidebarMenu className="flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild tooltip={item.text} isActive={pathname === item.href}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.text}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarMenu className="mt-auto">
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
