
'use client';

import { AdminDashboard } from './dashboard';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingScreen } from '@/components/ui/loading';

export default function AdminPage() {
    const { isAdmin, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !isAdmin) {
            router.push('/login');
        }
    }, [isAdmin, isUserLoading, router]);

    if (isUserLoading) {
        return <LoadingScreen text="Verifying credentials..."/>;
    }
    
    if (!isAdmin) {
        return null;
    }

    return <AdminDashboard />;
}
