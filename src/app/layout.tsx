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
        <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.cdnfonts.com/css/jameel-noori-nastaleeq" rel="stylesheet" />

      </head>
      <body className='font-roboto'>
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
