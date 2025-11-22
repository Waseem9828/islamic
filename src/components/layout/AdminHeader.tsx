'use client';

import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export const AdminHeader = ({ onMenuClick }: { onMenuClick: () => void }) => {
  return (
    <header className="flex items-center justify-between md:justify-end h-16 px-4 bg-white border-b">
       <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
            <Menu className="w-6 h-6" />
        </Button>
      <div className="text-lg font-semibold">Welcome, Admin!</div>
      {/* You can add more header content here, like a user dropdown */}
    </header>
  );
};
