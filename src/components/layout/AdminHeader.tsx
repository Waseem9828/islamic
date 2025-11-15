
'use client';

import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '../ui/button';
import { LogOut, Menu } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const AdminHeader = () => {
  const { auth } = useFirebase();
  const router = useRouter();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };


  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 border-b bg-background shadow-sm sm:px-6">
      <div className="flex items-center gap-2">
         <SidebarTrigger className="md:hidden">
            <Menu />
         </SidebarTrigger>
         <h1 className="text-lg font-semibold text-primary">Admin Panel</h1>
      </div>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </header>
  );
};

export default AdminHeader;
