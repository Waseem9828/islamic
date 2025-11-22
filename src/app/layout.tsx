'use client';

import './globals.css';
import ClientLayout from '@/components/layout/ClientLayout';
import { Toaster } from "@/components/ui/sonner";

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
          {children}
        </ClientLayout>
        <Toaster />
      </body>
    </html>
  );
}
