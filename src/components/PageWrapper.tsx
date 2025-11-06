import type { ReactNode } from 'react';
import { BackButton } from './BackButton';

interface PageWrapperProps {
  title: string;
  children: ReactNode;
}

export function PageWrapper({ title, children }: PageWrapperProps) {
  return (
    <div className="flex flex-col items-center min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-2xl flex justify-between items-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl text-primary">
          {title}
        </h1>
        <BackButton href="/" />
      </header>
      <main className="w-full max-w-2xl">
        {children}
      </main>
    </div>
  );
}
