"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BottomNavbar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/matchmaking", label: "Play" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/wallet", label: "Wallet" },
    { href: "/profile", label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 md:hidden">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={`flex flex-col items-center ${pathname === item.href ? "text-blue-400" : ""}`}>

              {item.label}

          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavbar;
