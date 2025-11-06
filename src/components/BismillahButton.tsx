"use client"
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const BismillahButton = ({ href, children, className }: { href: string, children: React.ReactNode, className?: string }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // We can't play audio reliably on click, so we'll skip it for now.
    // This is a browser security feature.
    
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 1000);
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(`
        relative overflow-hidden
        bg-islamic-green text-white
        px-8 py-4 rounded-lg
        text-xl font-arabic
        shadow-lg transform transition-all
        hover:bg-islamic-lightGreen
        hover:scale-105
        active:scale-95
        border-2 border-islamic-gold
        flex items-center justify-center
        ${isPressed ? 'ring-4 ring-islamic-gold' : ''}
      `, className)}
    >
      <div 
        className="absolute inset-0 opacity-10"
        style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")"
        }}
       ></div>
      
      <span className="relative z-10">
        {children || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
      </span>
      
      {isPressed && (
        <div className="absolute inset-0 bg-islamic-gold opacity-30 animate-ping"></div>
      )}
    </Link>
  );
};
