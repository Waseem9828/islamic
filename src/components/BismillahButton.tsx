"use client";
import { useState } from 'react';
import { cn } from '@/lib/utils';
import React from 'react';

const BismillahButton = ({ onClick, children, disabled = false }: { onClick: () => void, children?: React.ReactNode, disabled?: boolean }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    
    // Start animation
    setIsAnimating(true);
    
    // Play audio (Bismillah sound)
    if (typeof window !== 'undefined') {
      const audio = new Audio('/audio/bismillah.mp3');
      audio.play().catch(() => {}); // silent error handling
    }
    
    // Call the main function after 1 second
    setTimeout(() => {
      if (onClick) onClick();
      setIsAnimating(false);
    }, 1000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isAnimating}
      className={cn(`
        relative overflow-hidden
        bg-primary
        text-primary-foreground px-8 py-4 rounded-2xl
        text-2xl
        shadow-2xl transform transition-all duration-300
        hover:scale-105 hover:shadow-xl
        active:scale-95
        border-2 border-primary-foreground/20
        disabled:opacity-50 disabled:cursor-not-allowed`,
        isAnimating ? 'ring-4 ring-primary/50 animate-pulse' : ''
      )}
    >
      {/* Islamic pattern background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23FFF' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`
        }}
      ></div>
      
      {/* Button text */}
      <span className="relative z-10 flex items-center justify-center">
        {children || 'Start Draw'}
      </span>
      
      {/* Click animation */}
      {isAnimating && (
        <div className="absolute inset-0 bg-primary opacity-40 animate-ping rounded-2xl"></div>
      )}
      
    </button>
  );
};

export { BismillahButton };
