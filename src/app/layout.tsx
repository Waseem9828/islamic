import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/sonner"
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
// Import directly from the source file to avoid circular dependencies
import { ClientFirebaseProvider } from '@/firebase/client-provider';
import { Sidebar, SidebarProvider, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home, Wallet, Landmark } from 'lucide-react';
// Import directly from the source file
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export const metadata: Metadata = {
  title: 'Premium Numbers',
  description: 'Your premium number prediction service',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ClientFirebaseProvider>
          {/* The listener must be inside the provider to access its context */}
          <FirebaseErrorListener />
          <SidebarProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <div className="flex flex-1">
                <Sidebar>
                  <SidebarContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton href="/" icon={<Home />}>
                          Home
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton href="/deposit" icon={<Wallet />}>
                          Deposit
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton href="/withdraw" icon={<Landmark />}>
                          Withdraw
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarContent>
                </Sidebar>
                <main className="flex-1 p-4">
                  {children}
                </main>
              </div>
              <Footer />
            </div>
          </SidebarProvider>
        </ClientFirebaseProvider>
        <Toaster />
      </body>
    </html>
  );
}
