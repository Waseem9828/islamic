
import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Toaster as ShadToaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { ClientFirebaseProvider } from '@/firebase/client-provider';
import { Sidebar, SidebarProvider, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home, Wallet, Landmark, Gem, User } from 'lucide-react';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export const metadata: Metadata = {
  title: 'Premium Numbers',
  description: 'Your premium number prediction service',
  manifest: '/manifest.json',
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
          <FirebaseErrorListener />
          <SidebarProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <div className="flex flex-1">
                <Sidebar side="left" collapsible="offcanvas" className="md:hidden">
                  <SidebarContent>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/">
                            <Home className="h-4 w-4" />
                            Home
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                       <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/subscriptions">
                            <Gem className="h-4 w-4" />
                            Subscriptions
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/deposit">
                            <Wallet className="h-4 w-4" />
                            Deposit
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/withdraw">
                            <Landmark className="h-4 w-4" />
                            Withdraw
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                       <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                           <Link href="/profile">
                            <User className="h-4 w-4" />
                            Profile
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarContent>
                </Sidebar>
                <main className="flex-1 w-full max-w-5xl mx-auto">
                  {children}
                </main>
              </div>
              <Footer />
            </div>
          </SidebarProvider>
        </ClientFirebaseProvider>
        <ShadToaster />
        <SonnerToaster richColors />
      </body>
    </html>
  );
}
