
'use client';

import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from "@/components/admin/sidebar";
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

// --- UI Components for Different States ---

const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying credentials...</p>
    </div>
);

const AccessDenied = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow-lg text-center">
            <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
            <p className="text-lg text-gray-700 dark:text-gray-200">You do not have permission to view this page.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please contact an administrator if you believe this is an error.</p>
        </div>
    </div>
);

// --- Main Admin Layout Component ---

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAdmin, isAdminLoading } = useAdmin();
    const router = useRouter();

    useEffect(() => {
        if (!isAdminLoading && !isAdmin) {
            router.push('/login');
        }
    }, [isAdmin, isAdminLoading, router]);


    // --- Render based on Authorization Status ---

    if (isAdminLoading) {
        return <LoadingScreen />;
    }

    if (!isAdmin) {
        return <AccessDenied />;
    }

    // If authorized, render the full admin layout
    return (
        <div className="min-h-screen bg-muted/40">
            <AdminSidebar />
            <main className="md:pl-64">
                {children}
            </main>
        </div>
    );
}
