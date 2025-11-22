'use client';

import './globals.css';
import ClientLayout from '@/components/layout/ClientLayout';
import BottomNavbar from '@/components/BottomNavbar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>Premium Numbers</title>
        <meta name="description" content="Your premium number prediction service" />
      </head>
      <body>
        <ClientLayout>
          <div className="pb-16">{children}</div>
          <BottomNavbar />
        </ClientLayout>
      </body>
    </html>
  );
}
