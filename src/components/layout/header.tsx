import React from 'react';
import { Button } from '../ui/button';
import { Bell } from 'lucide-react';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 border-b bg-background shadow-sm">
      <h1 className="text-xl font-bold text-primary">Premium Numbers</h1>
      <Button variant="ghost" size="icon">
        <Bell className="h-5 w-5" />
        <span className="sr-only">Notifications</span>
      </Button>
    </header>
  );
};

export default Header;
