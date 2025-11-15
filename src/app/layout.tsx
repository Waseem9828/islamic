import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { FirebaseClientProvider } from '@/firebase';
import { Sidebar, SidebarProvider, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home, Wallet, Landmark } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Premium Numbers',
  description: 'Your premium number prediction service',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <FirebaseClientProvider>
          <SidebarProvider>
            <div className="flex flex-col min-h-screen max-w-sm mx-auto bg-background">
              <Header />
              <div className="flex flex-1">
                <Sidebar className="w-64">
                  <SidebarContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton href="/" tooltip="Home">
                          <Home className="h-5 w-5" />
                          Home
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton href="/wallet" tooltip="Wallet">
                          <Wallet className="h-5 w-5" />
                          Wallet
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton href="/deposit" tooltip="Deposit">
                          <Landmark className="h-5 w-5" />
                          Deposit
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarContent>
                </Sidebar>
                <main className="flex-grow">
                  {children}
                </main>
              </div>
              <Footer />
            </div>
            <Toaster />
          </SidebarProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
