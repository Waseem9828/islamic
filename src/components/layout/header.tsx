'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Shield } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { httpsCallable } from 'firebase/functions';

export function Header() {
    const { auth, functions } = useFirebase();
    const [user, setUser] = useState(auth?.currentUser);
    const [isAdmin, setIsAdmin] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            if (user) {
                // Check for admin status when user logs in
                const checkAdmin = httpsCallable(functions, 'checkAdminStatus');
                checkAdmin()
                    .then((result) => {
                        setIsAdmin((result.data as { isAdmin: boolean }).isAdmin);
                    })
                    .catch((error) => {
                        console.error("Error checking admin status:", error);
                        setIsAdmin(false);
                    });
            } else {
                setIsAdmin(false);
            }
        });
        return () => unsubscribe();
    }, [auth, functions]);

    const handleSignOut = async () => {
        if (!auth) return;
        await auth.signOut();
        // Redirect to home or login page after sign out
        window.location.href = '/';
    };

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/about', label: 'About' },
        { href: '/contact', label: 'Contact' },
        // Add more links as needed
    ];

    return (
        <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="text-2xl font-bold text-gray-800 dark:text-white">
                           Logo
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex md:items-center md:space-x-8">
                        {navLinks.map((link) => (
                            <Link key={link.href} href={link.href} className={`text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors ${pathname === link.href ? 'font-semibold text-blue-600' : ''}`}>
                                    {link.label}
                            </Link>
                        ))}
                        {isAdmin && (
                             <Link href="/admin/dashboard" className={`flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors ${pathname.startsWith('/admin') ? 'font-semibold text-blue-600' : ''}`}>
                                <Shield className="mr-1 h-5 w-5" />
                                Admin
                            </Link>
                        )}
                    </nav>

                    {/* Auth buttons & User info */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <>
                                <span className="text-gray-700 dark:text-gray-300">Welcome, {user.displayName || user.email}</span>
                                <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
                            </>
                        ) : (
                            <>
                                <Button asChild variant="default">
                                    <Link href="/login">Login</Link>
                                </Button>
                                <Button asChild variant="secondary">
                                    <Link href="/register">Sign Up</Link>
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Menu className="h-6 w-6" />
                                    <span className="sr-only">Open menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right">
                                <div className="flex flex-col space-y-4 p-4">
                                    {navLinks.map((link) => (
                                        <Link key={link.href} href={link.href} className="text-gray-700 dark:text-gray-200 hover:text-blue-500">
                                                {link.label}
                                        </Link>
                                    ))}
                                     {isAdmin && (
                                        <Link href="/admin/dashboard" className="flex items-center text-gray-700 dark:text-gray-200 hover:text-blue-500">
                                            <Shield className="mr-2 h-5 w-5" />
                                            Admin Panel
                                        </Link>
                                    )}
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                         {user ? (
                                            <div className="flex flex-col space-y-3">
                                                <span className="font-medium text-gray-800 dark:text-gray-200">{user.displayName || user.email}</span>
                                                <Button onClick={handleSignOut} variant="destructive">Sign Out</Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col space-y-3">
                                                <Button asChild className="w-full"><Link href="/login">Login</Link></Button>
                                                <Button asChild variant="outline" className="w-full"><Link href="/register">Sign Up</Link></Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
}
