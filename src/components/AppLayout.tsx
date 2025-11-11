'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LogIn, UserCircle, Shield, LogOut, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { useAdmin } from '@/hooks/use-admin';
import { getAuth, signOut } from 'firebase/auth';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { isAdmin } = useAdmin();

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push('/login');
  };

  const navItems = user
    ? [
        { href: '/', label: 'Home', icon: Home },
        { href: '/subscription', label: 'Subscription', icon: Gem },
        { href: '/profile', label: 'Profile', icon: UserCircle },
      ]
    : [{ href: '/login', label: 'Login', icon: LogIn }];

  const getPageTitle = () => {
    if (pathname.startsWith('/admin')) return 'Admin Panel';
    if (pathname === '/') return 'User Dashboard';
    if (pathname === '/login') return 'Login / Signup';
    if (pathname === '/profile') return 'User Profile';
    if (pathname === '/subscription') return 'Subscription Plans';
    if (pathname === '/draw') return 'Islamic Draw';
    if (pathname === '/exact-selection') return 'Exact Selection';
    if (pathname === '/community') return 'Community';
    return 'Islamic Draw';
  };

  // Do not render layout for login page or while loading
  if (pathname === '/login' || isUserLoading) {
     return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-islamic-dark via-islamic-green to-islamic-dark text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white bg-opacity-10 backdrop-blur-md p-4 flex justify-between items-center z-40 border-b border-islamic-gold border-opacity-20">
        <h1 className="text-xl font-bold text-islamic-gold">{getPageTitle()}</h1>
        <div className="flex items-center gap-4">
            {isAdmin && (
                 <Link href="/admin" className="p-2 rounded-full hover:bg-white hover:bg-opacity-20" title="Admin Panel">
                    <Shield className="text-islamic-gold" />
                </Link>
            )}
            {user && (
                 <button onClick={handleLogout} className="p-2 rounded-full hover:bg-white hover:bg-opacity-20" title="Logout">
                    <LogOut className="text-islamic-gold" />
                </button>
            )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-20 pb-20">
        {children}
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-10 backdrop-blur-md z-40 border-t border-islamic-gold border-opacity-20">
        <nav className="flex justify-around items-center p-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn(
              "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors w-24",
              pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-white hover:bg-white hover:bg-opacity-10'
            )}>
              <item.icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
