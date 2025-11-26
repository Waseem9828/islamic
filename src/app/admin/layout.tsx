
'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying credentials...</p>
    </div>
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isAdmin, isUserLoading } = useUser();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (isUserLoading) {
            return;
        }
        if (!user || !isAdmin) {
            router.replace('/login');
        }
    }, [user, isAdmin, isUserLoading, router]);

    if (isUserLoading || !isAdmin) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-muted/40">
            <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <div className="md:pl-20 group-data-[sidebar-collapsed=false]:md:pl-64 transition-all duration-300 ease-in-out">
                <main>
                    {children}
                </main>
            </div>
        </div>
    );
}
