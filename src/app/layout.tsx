import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AppLayout } from '@/components/AppLayout';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'Islamic Random Selector',
  description: 'Islamic way of random selection',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body>
        <FirebaseClientProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
