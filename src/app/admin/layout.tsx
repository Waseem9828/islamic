
'use client';

import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';

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
    const { isUserLoading } = useUser();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        // Wait until loading is complete before making a decision
        if (isAdminLoading || isUserLoading) {
            return;
        }
        // If loading is done and the user is NOT an admin, redirect them.
        if (!isAdmin) {
            router.replace('/login');
        }
    }, [isAdmin, isAdminLoading, isUserLoading, router]);


    // --- Render based on Authorization Status ---

    if (isAdminLoading || isUserLoading) {
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
            <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <div className="md:pl-20 group-data-[sidebar-collapsed=false]:md:pl-64 transition-all duration-300 ease-in-out">
                {/* A simple header can be added here if needed */}
                <main>
                    {children}
                </main>
            </div>
        </div>
    );
}
