'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { ChevronRight, Bell, Shield, LogOut } from 'lucide-react';

const ProfilePage = () => {
  const router = useRouter();

  const handleLogout = () => {
    // In a real app, you'd clear the user session here
    router.push('/login');
  };
  
  const menuItems = [
    {
      label: 'My Subscriptions',
      icon: Bell,
      action: () => router.push('/subscriptions'),
    },
    {
      label: 'Privacy Policy',
      icon: Shield,
      action: () => {
        /* Navigate to Privacy Policy */
      },
    },
  ];

  return (
    <div className="p-4">
      <div className="flex flex-col items-center mb-8">
        <Avatar className="w-24 h-24 mb-4">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold">Username</h1>
        <p className="text-muted-foreground">user@example.com</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {menuItems.map((item, index) => (
               <li
                key={index}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                onClick={item.action}
              >
                <div className="flex items-center gap-4">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        className="w-full mt-8"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </div>
  );
};

export default ProfilePage;
