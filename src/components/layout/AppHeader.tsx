
'use client';

import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Bell, Menu, Wallet } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useUser, useFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useDoc } from "@/firebase";

const AppHeader = () => {
    const { open, setOpen } = useSidebar();
    const { user } = useUser();
    const { firestore } = useFirebase();

    const walletDocRef = firestore && user ? doc(firestore, 'wallets', user.uid) : null;
    const { data: wallet } = useDoc(walletDocRef);

    const totalBalance = wallet ? wallet.depositBalance + wallet.winningBalance : 0;

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
             <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button size="icon" variant="outline" className="sm:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="sm:max-w-xs">
                    {/* Add your mobile navigation links here */}
                </SheetContent>
            </Sheet>
            <div className="relative flex-1 md:grow-0">
                {/* You can add a search bar here if you want */}
            </div>
            <div className="flex items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <Link href="/wallet" className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    <span className="font-semibold">₹{totalBalance.toFixed(2)}</span>
                </Link>
                <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                </Button>
                <Link href="/profile">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.photoURL || ''} alt="User avatar" />
                        <AvatarFallback>{user?.displayName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                </Link>
            </div>
        </header>
    )
}

export default AppHeader;
