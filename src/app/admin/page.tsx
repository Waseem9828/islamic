
'use client';

import { AdminDashboard } from './dashboard';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
    const { isAdmin, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !isAdmin) {
            router.push('/login');
        }
    }, [isAdmin, isUserLoading, router]);

    if (isUserLoading) {
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
