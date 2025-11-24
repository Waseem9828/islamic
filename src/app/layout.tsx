import './globals.css';
import { Providers } from './providers';
import ClientLayout from '@/components/layout/ClientLayout';
import { Toaster } from 'sonner';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Premium Numbers</title>
        <meta
          name="description"
          content="Your premium number prediction service"
        />
      </head>
      <body>
        <Providers>
          <SidebarProvider>
            <ClientLayout>{children}</ClientLayout>
          </SidebarProvider>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
