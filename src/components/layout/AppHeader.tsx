'use client';

import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Bell, Menu, Wallet } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useFirebase } from "@/firebase";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";
import { useState, useEffect, useMemo } from "react";

const AppHeader = () => {
    const { open, setOpen } = useSidebar();
    const { user, firestore } = useFirebase();
    const [wallet, setWallet] = useState<DocumentData | null>(null);

    useEffect(() => {
        if (user && firestore) {
            const walletDocRef = doc(firestore, 'wallets', user.uid);
            const unsubscribe = onSnapshot(walletDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    setWallet(docSnap.data());
                } else {
                    setWallet({ depositBalance: 0, winningBalance: 0, bonusBalance: 0 });
                }
            }, (error) => {
                console.error("Failed to fetch wallet in AppHeader:", error);
                setWallet(null);
            });
            return () => unsubscribe();
        }
    }, [user, firestore]);

    const totalBalance = useMemo(() => {
        if (!wallet) return 0;
        return (wallet.depositBalance || 0) + (wallet.winningBalance || 0) + (wallet.bonusBalance || 0);
    }, [wallet]);

    const getInitials = (name: string | null | undefined): string => {
        if (!name) return '??';
        const nameParts = name.split(' ').filter(Boolean);
        if (nameParts.length === 0) return '??';
        return nameParts.map(part => part[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="md:hidden">
                    <Menu className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-semibold hidden md:block">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
                <Link href="/wallet" passHref>
                    <Button variant="outline" className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        <span>₹{totalBalance.toFixed(2)}</span>
                    </Button>
                </Link>

                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Bell className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Notifications</SheetTitle>
                            <SheetDescription>
                                You have no new notifications.
                            </SheetDescription>
                        </SheetHeader>
                    </SheetContent>
                </Sheet>

                {user && (
                     <Link href="/profile" passHref>
                        <Avatar className="cursor-pointer">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'user avatar'} />
                            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                        </Avatar>
                    </Link>
                )}
            </div>
        </header>
    );
};

export default AppHeader;
