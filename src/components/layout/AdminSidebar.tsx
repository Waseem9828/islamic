
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Users, List, Gem, IndianRupee, Settings, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';


const adminFeatures = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { title: 'Numbers', icon: List, path: '/admin/numbers' },
    { title: 'Users', icon: Users, path: '/admin/users' },
    { title: 'Subscriptions', icon: Gem, path: '/admin/subscriptions' },
    { title: 'Deposits', icon: IndianRupee, path: '/admin/deposit-requests' },
    { title: 'Payments', icon: Settings, path: '/admin/payment-settings' },
];

const AdminSidebar = () => {
    const pathname = usePathname();

    return (
        <Sidebar collapsible="icon" className="hidden md:flex">
            <SidebarContent>
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
            </SidebarContent>
        </Sidebar>
    );
};

export default AdminSidebar;

