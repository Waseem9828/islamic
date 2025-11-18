'use client';

import './globals.css';
import ClientLayout from '@/components/layout/ClientLayout';

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
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
