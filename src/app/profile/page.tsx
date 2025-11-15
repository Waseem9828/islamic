'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { ChevronRight, Bell, Shield, LogOut, MessageCircle } from 'lucide-react';

const ProfilePage = () => {
  const router = useRouter();
  const [isWhatsAppEnabled, setIsWhatsAppEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleLogout = () => {
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

  const user = {
      photoURL: "https://github.com/shadcn.png",
      email: "user@example.com",
      displayName: "Username"
  }

  return (
    <div className="p-4 space-y-8">
      <div className="flex flex-col items-center">
        <Avatar className="w-24 h-24 mb-4 border-2 border-primary">
          <AvatarImage src={user.photoURL || "https://github.com/shadcn.png"} alt="User avatar" />
          <AvatarFallback>{user.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold">{user.displayName || 'Username'}</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {menuItems.map((item, index) => (
               <li
                key={index}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 active:bg-muted/80"
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

      <Card className="bg-muted/30">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Notification Settings
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-md bg-muted/50">
                <Label htmlFor="whatsapp-switch" className="font-medium">WhatsApp Notifications</Label>
                <Switch 
                    id="whatsapp-switch"
                    checked={isWhatsAppEnabled}
                    onCheckedChange={setIsWhatsAppEnabled}
                />
            </div>
            {isWhatsAppEnabled && (
                <div className="space-y-2 p-4 pt-0">
                    <Label htmlFor="phone-number">WhatsApp Number</Label>
                    <Input 
                        id="phone-number"
                        type="tel"
                        placeholder="+91 12345 67890"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <Button className="w-full mt-2">Save</Button>
                </div>
            )}
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        className="w-full"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </div>
  );
};

export default ProfilePage;
