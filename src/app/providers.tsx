'use client';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { FirebaseProvider } from '@/firebase/provider';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider 
                attribute="class" 
                defaultTheme="system" 
                enableSystem
                disableTransitionOnChange
            >
                <FirebaseProvider>
                    {children}
                    <Toaster richColors position="top-center" />
                </FirebaseProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
