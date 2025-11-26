
'use client';

import { AdminDashboard } from '../dashboard';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
    const { isAdmin, isAdminLoading } = useAdmin();
    const router = useRouter();

    useEffect(() => {
        if (!isAdminLoading && !isAdmin) {
            router.push('/login');
        }
    }, [isAdmin, isAdminLoading, router]);

    if (isAdminLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!isAdmin) {
        return null;
    }

    return <AdminDashboard />;
}
