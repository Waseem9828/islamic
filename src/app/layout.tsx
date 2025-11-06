import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'اسلامی قرعہ اندازی - Islamic Random Selector',
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
    <html lang="ur" dir="rtl">
      <head>
        <meta name="theme-color" content="#006400" />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
