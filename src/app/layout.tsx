import './globals.css';
import { Providers } from './providers';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-poppins',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <head>
        <title>Ludo Arena</title>
        <meta
          name="description"
          content="Challenge your friends and win real cash in Ludo Arena battles!"
        />
         <meta name="keywords" content="Ludo Arena, real cash, online gaming, ludo challenge, play and earn" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
