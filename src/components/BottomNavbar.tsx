
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, History, User, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const BottomNavbar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/matchmaking", label: "Play", icon: Gamepad2 },
    { href: "/match-history", label: "History", icon: History },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <div className="grid h-16 grid-cols-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === "/matchmaking" && pathname === "/play");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavbar;
