'use client';

import { useEffect, useState } from 'react';
import { useFirebase } from '@/firebase/provider';
import { useRouter, usePathname } from 'next/navigation';
import { httpsCallable } from 'firebase/functions';
import { onAuthStateChanged } from 'firebase/auth';
import { AdminSidebar } from "@/components/admin/sidebar";
import { Loader2 } from 'lucide-react';

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
    const { auth, functions } = useFirebase();
    const router = useRouter();
    const pathname = usePathname();

    // State to track authorization status: loading, allowed, denied
    const [authStatus, setAuthStatus] = useState('loading');

    useEffect(() => {
        if (!auth || !functions) return;

        // Use onAuthStateChanged for robust auth state handling
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is logged in, now verify if they are an admin
                try {
                    const checkAdmin = httpsCallable(functions, 'checkAdminStatus');
                    const result = await checkAdmin();
                    const isAdmin = (result.data as { isAdmin: boolean }).isAdmin;

                    if (isAdmin) {
                        setAuthStatus('allowed');
                    } else {
                        setAuthStatus('denied');
                    }
                } catch (error) {
                    console.error('Error calling checkAdminStatus function:', error);
                    setAuthStatus('denied');
                }
            } else {
                // User is not logged in, redirect them to the login page
                router.push(`/login?redirect=${pathname}`);
            }
        });

        // Cleanup subscription on component unmount
        return () => unsubscribe();
    }, [auth, functions, router, pathname]);

    // --- Render based on Authorization Status ---

    if (authStatus === 'loading') {
        return <LoadingScreen />;
    }

    if (authStatus === 'denied') {
        return <AccessDenied />;
    }

    // If authorized, render the full admin layout
    if (authStatus === 'allowed') {
        return (
            <div className="min-h-screen bg-muted/40">
                <AdminSidebar />
                <main className="md:pl-64">
                    {children}
                </main>
            </div>
        );
    }

    // Fallback case, should not be reached
    return null;
}
