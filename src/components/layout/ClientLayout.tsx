
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Toaster as ShadToaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Sidebar, SidebarProvider, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Home, Landmark, User, Swords } from 'lucide-react';
import { ClientFirebaseProvider } from '@/firebase/client-provider';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const noSidebarRoutes = ['/login', '/signup', '/'];
  const showSidebar = !noSidebarRoutes.includes(pathname) && !pathname.startsWith('/admin');

  return (
    <ClientFirebaseProvider>
      <SidebarProvider>
        <div className="flex flex-col min-h-screen w-full">
          <Header />
          <div className="flex flex-1 w-full">
            {showSidebar && (
              <Sidebar side="left" collapsible="offcanvas">
                <SidebarContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/matchmaking">
                          <Home className="h-4 w-4" />
                          Home
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/play">
                          <Swords className="h-4 w-4" />
                          Play
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link href="/wallet">
                          <Landmark className="h-4 w-4" />
                          Wallet
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
            )}
            <main className="flex-1 w-full">
              {children}
            </main>
          </div>
          <Footer />
        </div>
      </SidebarProvider>
      <ShadToaster />
      <SonnerToaster richColors />
    </ClientFirebaseProvider>
  );
}
