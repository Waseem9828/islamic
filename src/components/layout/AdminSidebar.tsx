
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Users, IndianRupee, Settings, LayoutDashboard, ArrowLeft, ListChecks } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';


const adminFeatures = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { title: 'Users', icon: Users, path: '/admin/users' },
    { title: 'Deposits', icon: IndianRupee, path: '/admin/deposit-requests' },
    { title: 'Withdrawals', icon: ListChecks, path: '/admin/withdrawal-requests' },
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
            <SidebarMenu>
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

    if (isMobile) {
        return (
             <Sidebar side="left" collapsible="offcanvas" className="md:hidden">
                <SidebarContent>
                    <AdminSidebarMenuContent />
                </SidebarContent>
            </Sidebar>
        )
    }

    return (
        <Sidebar collapsible="icon" className="hidden md:flex bg-muted/30">
            <SidebarContent>
               <AdminSidebarMenuContent />
            </SidebarContent>
        </Sidebar>
    );
};

export default AdminSidebar;

    