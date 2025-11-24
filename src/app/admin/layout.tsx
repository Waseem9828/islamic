
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

// --- Main Admin Layout Component ---

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAdmin, isAdminLoading } = useAdmin();
    const router = useRouter();

    useEffect(() => {
        // Wait until loading is complete before making a decision
        if (isAdminLoading) {
            return;
        }
        // If loading is done and the user is NOT an admin, redirect them.
        if (!isAdmin) {
            router.replace('/login');
        }
    }, [isAdmin, isAdminLoading, router]);


    // --- Render based on Authorization Status ---

    if (isAdminLoading) {
        return <LoadingScreen />;
    }

    // If authorized, render the full admin layout.
    // If not, this will be briefly rendered before the useEffect triggers the redirect.
    // We can return null or a loading state to prevent a flash of content.
    if (!isAdmin) {
        return <LoadingScreen />;
    }
    
    return (
        <div className="min-h-screen bg-muted/40">
            <AdminSidebar />
            <main className="md:pl-64">
                {children}
            </main>
        </div>
    );
}
