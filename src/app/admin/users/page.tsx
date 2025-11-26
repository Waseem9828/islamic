
'use client';

import { UserClient } from "./user-client";
import { UsersDashboard } from "@/components/admin/UsersDashboard";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from 'react';
import { Loader2 } from "lucide-react";

// NOTE: We are keeping the stats dashboard client-side for now
// to avoid the complexity of passing server-fetched data down.
// This can be optimized later if needed.
const initialStats = {
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    newToday: 0,
    kycVerifiedUsers: 0,
};

export default function ManageUsersPage() {
    const { user, isAdmin, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !isAdmin) {
            router.push('/login');
        }
    }, [isAdmin, isUserLoading, router]);

    if (isUserLoading || !isAdmin) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900/50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">User Management</h1>
                
                {/* The UsersDashboard can be enhanced to fetch its own stats or receive them as props */}
                <UsersDashboard stats={initialStats} />

                <div className="bg-white dark:bg-gray-900/80 rounded-lg shadow-md">
                     <UserClient />
                </div>
            </div>
        </div>
    );
}
