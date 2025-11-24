
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Home, Trophy, User, Wallet, History, Star } from "lucide-react";

const BottomNavbar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/matchmaking", label: "Play", icon: Home },
    { href: "/play", label: "Create", icon: Star },
    { href: "/leaderboard", label: "Ranks", icon: Trophy },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/match-history", label: "History", icon: History },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <div className="grid h-16 grid-cols-5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 p-2 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavbar;
