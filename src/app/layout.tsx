import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';
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
    <html lang="en" className={poppins.variable}>
      <head>
        <title>Islamic Random Selector</title>
        <meta
          name="description"
          content="A fair and random number selector with an Islamic theme."
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
