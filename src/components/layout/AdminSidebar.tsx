
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Users, IndianRupee, Settings, LayoutDashboard, ArrowLeft, ListChecks, Trophy, History } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';


const adminFeatures = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { title: 'Users', icon: Users, path: '/admin/users' },
    { title: 'Matches', icon: Trophy, path: '/admin/matches' },
    { title: 'Transactions', icon: History, path: '/admin/transactions' },
    { title: 'Deposits', icon: IndianRupee, path: '/admin/deposit-requests' },
    { title: 'Withdrawals', icon: ListChecks, path: '/admin/withdrawals' },
    { title: 'App Rules', icon: Settings, path: '/admin/settings' },
    { title: 'Payments', icon: Settings, path: '/admin/payment-settings' },
];

const AdminSidebarMenuContent = () => {
    const pathname = usePathname();
    return (
        <>
            <SidebarHeader>
                <h2 className="text-lg font-semibold text-center group-data-[collapsible=icon]:hidden">
                    Admin
                </h2>
            </SidebarHeader>
            <SidebarMenu className="flex-1 overflow-y-auto">
                    {adminFeatures.map((feature) => {
                    const isActive = pathname === feature.path;
                    return (
                        <SidebarMenuItem key={feature.title}>
                            <SidebarMenuButton asChild tooltip={feature.title} isActive={isActive}>
                                <Link href={feature.path}>
                                    <feature.icon />
                                    <span>{feature.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )
                })}
            </SidebarMenu>
            <SidebarMenu className="mt-auto">
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Back to App">
                            <Link href="/">
                            <ArrowLeft />
                            <span>Back to App</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </>
    )
}

const AdminSidebar = () => {
  const { isMobile } = useSidebar();

  return (
    <Sidebar
      collapsible={isMobile ? "offcanvas" : "icon"}
      className="bg-muted/30"
      side="left"
    >
      <SidebarContent>
        <AdminSidebarMenuContent />
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;
