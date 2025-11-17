
import type { Metadata, Viewport } from 'next';
import './globals.css';
import ClientLayout from '@/components/layout/ClientLayout';
import { ClientFirebaseProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'Premium Numbers',
  description: 'Your premium number prediction service',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <ClientFirebaseProvider>
          <ClientLayout>{children}</ClientLayout>
        </ClientFirebaseProvider>
      </body>
    </html>
  );
}
