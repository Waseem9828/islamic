'use client';

import BottomNavbar from '@/components/BottomNavbar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
        <div className="pb-16">{children}</div>
        <BottomNavbar />
    </>
  );
}
