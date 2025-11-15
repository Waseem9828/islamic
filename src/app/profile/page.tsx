
"use client";
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { ChevronRight, Bell, Shield, LogOut, UserCog, Wallet } from 'lucide-react';
import { useUser, useDoc, useFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';

const ProfilePage = () => {
  const router = useRouter();
  const { user, loading } = useUser();
  const { auth } = useFirebase();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <Avatar className="mx-auto w-24 h-24 mb-4">
            <AvatarImage src={user.photoURL || "/avatar.png"} alt={user.displayName || 'User'} />
            <AvatarFallback>{user.displayName ? user.displayName[0] : 'U'}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-xl">{user.displayName || 'User Profile'}</CardTitle>
          <p className="text-sm text-gray-500">UID: {user.uid}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-between" onClick={() => router.push('/wallet')}>
              <div className="flex items-center">
                <Wallet className="mr-2 h-4 w-4" />
                <span>My Wallet</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="w-full justify-between">
              <div className="flex items-center">
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="w-full justify-between">
              <div className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                <span>Security</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="w-full justify-between" onClick={() => router.push('/admin')}>
              <div className="flex items-center">
                <UserCog className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProfilePage;
