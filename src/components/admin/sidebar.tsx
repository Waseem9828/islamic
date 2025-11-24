'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Trophy, Settings, LogOut, IndianRupee, History } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useFirebase } from '@/firebase/provider'; // Corrected import path
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const NavLink = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link href={href}>
            <div className={`flex items-center p-3 my-1 text-sm font-medium rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                <Icon className="h-5 w-5" />
                <span className="ml-3">{label}</span>
            </div>
        </Link>
    );
};

export const AdminSidebar = () => {
    const { auth } = useFirebase();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            toast.success('Signed out successfully');
            router.push('/login');
        } catch (error) {
            toast.error('Failed to sign out');
        }
    };

    return (
        <aside className="fixed top-0 left-0 h-screen w-64 bg-card border-r flex-col z-50 hidden md:flex">
            <div className="flex items-center justify-center h-16 border-b">
                <Link href="/admin">
                    <h1 className="text-xl font-bold">Admin Panel</h1>
                </Link>
            </div>
            <nav className="flex-1 p-4 overflow-y-auto">
                <NavLink href="/admin" icon={Home} label="Dashboard" />
                <NavLink href="/admin/users" icon={Users} label="Users" />
                <NavLink href="/admin/matches" icon={Trophy} label="Matches" />
                <NavLink href="/admin/deposit-requests" icon={IndianRupee} label="Deposits" />
                <NavLink href="/admin/withdrawals" icon={IndianRupee} label="Withdrawals" />
                <NavLink href="/admin/transactions" icon={History} label="Transactions" />
                <NavLink href="/admin/settings" icon={Settings} label="App Settings" />
            </nav>
            <div className="p-4 border-t">
                <button 
                    onClick={handleSignOut}
                    className="flex items-center p-3 w-full text-sm font-medium rounded-lg cursor-pointer transition-colors text-red-500 hover:bg-red-500/10"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="ml-3">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};
