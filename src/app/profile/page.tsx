'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { ChevronRight, Bell, Shield, LogOut, MessageCircle, Smartphone, Send, UserCog } from 'lucide-react';

const ProfilePage = () => {
  const router = useRouter();
  const [isWhatsAppEnabled, setIsWhatsAppEnabled] = useState(false);
  const [isSmsEnabled, setIsSmsEnabled] = useState(false);
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
      label: 'Admin Panel',
      icon: UserCog,
      action: () => router.push('/admin'),
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
                Cross-Platform Notifications
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-md bg-muted/50">
                <div className='flex items-center gap-2'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-green-500"><path d="M16.75 13.96c.25.13.41.2.52.28.18.13.28.24.36.4.08.16.12.36.12.61 0 .24-.04.44-.12.61-.08.17-.18.28-.36.4a1.6 1.6 0 0 1-.52.28c-1 .49-2.2.73-3.63.73-1.44 0-2.64-.24-3.63-.73a1.6 1.6 0 0 1-.52-.28 1.39 1.39 0 0 1-.36-.4 1.4 1.4 0 0 1-.12-.6c0-.26.04-.46.12.61.08-.16.18-.28.36-.4.11-.08.27-.15.52-.28.99-.49 2.2-.74 3.63-.74s2.64.25 3.63.74zm-6.3-3.92c.33-.16.55-.27.66-.33.22-.13.37-.25.44-.39.07-.14.1-.3.1-.48 0-.2-.03-.36-.1-.48-.07-.12-.19-.24-.44-.39-.11-.06-.33-.17-.66-.33-1-.5-2.24-.75-3.7-.75-1.47 0-2.7.25-3.7.75-.25.13-.42.2-.53.27-.18.13-.28.25-.36.4-.08.15-.12.32-.12.51 0 .19.04.36.12.51.08.15.18.27.36.4.11.07.28.14.53.27.99.5 2.23.75 3.7.75 1.46 0 2.7-.25 3.7-.75zm11.23-5.26A12 12 0 1 0 2.32 15.65L.05 24l8.35-2.22A11.95 11.95 0 0 0 12 22.01c6.63 0 12-5.37 12-12.01 0-2.3-.65-4.42-1.78-6.28z"/></svg>
                    <Label htmlFor="whatsapp-switch" className="font-medium">WhatsApp</Label>
                </div>
                <Switch 
                    id="whatsapp-switch"
                    checked={isWhatsAppEnabled}
                    onCheckedChange={setIsWhatsAppEnabled}
                />
            </div>
             <div className="flex items-center justify-between p-4 rounded-md bg-muted/50">
                <div className='flex items-center gap-2'>
                    <Smartphone className="w-5 h-5 text-sky-500" />
                    <Label htmlFor="sms-switch" className="font-medium">SMS Backup</Label>
                </div>
                <Switch 
                    id="sms-switch"
                    checked={isSmsEnabled}
                    onCheckedChange={setIsSmsEnabled}
                />
            </div>
            {(isWhatsAppEnabled || isSmsEnabled) && (
                <div className="space-y-2 p-4 pt-0">
                    <Label htmlFor="phone-number">Phone Number</Label>
                    <Input 
                        id="phone-number"
                        type="tel"
                        placeholder="+91 12345 67890"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                </div>
            )}
             <div className="flex items-center justify-between p-4 rounded-md bg-muted/50">
                <div className='flex items-center gap-2'>
                    <Send className="w-5 h-5 text-blue-500" />
                    <Label className="font-medium">Telegram Bot</Label>
                </div>
                <Button size="sm">Connect</Button>
            </div>
            {(isWhatsAppEnabled || isSmsEnabled) && (
                 <Button className="w-full mt-2">Save Settings</Button>
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
