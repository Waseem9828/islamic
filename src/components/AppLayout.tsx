'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dice5, Users, Target, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'ہوم', icon: Home },
  { href: '/draw', label: 'قرعہ', icon: Dice5 },
  { href: '/exact-selection', label: 'انتخاب', icon: Target },
  { href: '/community', label: 'کمیونٹی', icon: Users },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'الْقُرْعَةُ الْإِسْلَامِيَّةُ';
      case '/draw':
        return 'قرعہ اندازی';
      case '/exact-selection':
        return 'الاِخْتِيارُ الدَّقِيق';
      case '/community':
        return 'جَمَاعَتِ الْخَيْر';
      default:
        return 'اسلامی قرعہ';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-islamic-dark via-islamic-green to-islamic-dark text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white bg-opacity-10 backdrop-blur-md p-4 flex justify-between items-center z-40 border-b border-islamic-gold border-opacity-20">
        <h1 className="text-xl font-arabic text-islamic-gold">{getPageTitle()}</h1>
        <button className="p-2 rounded-full hover:bg-white hover:bg-opacity-20">
          <UserCircle className="text-islamic-gold" />
        </button>
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
              "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors w-20",
              pathname === item.href ? 'bg-islamic-gold text-islamic-dark' : 'text-white hover:bg-white hover:bg-opacity-10'
            )}>
              <item.icon className="w-6 h-6" />
              <span className="text-xs font-urdu">{item.label}</span>
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
