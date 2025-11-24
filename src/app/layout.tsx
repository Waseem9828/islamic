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
        <title>Islamic Random Selector</title>
        <meta
          name="description"
          content="A fair and random number selector with an Islamic theme."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet" />
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
