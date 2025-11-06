import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle, Clock, HeartHandshake, Info } from 'lucide-react';
import Link from 'next/link';

// Custom Mosque SVG component as lucide-react does not have one.
function Mosque({ size = 28, className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M2 22h20"/>
            <path d="M4 15V8c0-5.52 4.48-10 10-10s10 4.48 10 10v7"/>
            <path d="M12 22V10"/>
            <path d="M14 4c-1.1.6-2 1.4-2.5 2.5"/>
            <path d="M10 4c1.1.6 2 1.4 2.5 2.5"/>
            <path d="M4 22V10"/>
            <path d="M20 22V10"/>
        </svg>
    );
}

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <header className="text-center mb-8">
        <h1 className="font-headline text-5xl md:text-7xl text-primary mb-2">
          بسم اللہ الرحمن الرحیم
        </h1>
        <p className="text-muted-foreground text-lg">Islamic Random Selector</p>
      </header>

      <main className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <Link href="/draw" passHref>
                <Button className="w-full h-16 text-xl justify-between" size="lg">
                  <span className="flex items-center gap-4">
                    <PlayCircle size={28} />
                    بسم اللہ - قرعہ شروع کریں
                  </span>
                  <Mosque size={28} className="opacity-50" />
                </Button>
              </Link>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/prayer-times" passHref>
                  <Button variant="outline" className="w-full h-24 flex-col gap-2">
                    <Clock size={24} />
                    <span className="text-base">نماز کے اوقات</span>
                  </Button>
                </Link>

                <Link href="/sadaqah" passHref>
                  <Button variant="outline" className="w-full h-24 flex-col gap-2">
                    <HeartHandshake size={24} />
                    <span className="text-base">صدقہ کے فضائل</span>
                  </Button>
                </Link>

                <Link href="/about" passHref>
                  <Button variant="outline" className="w-full h-24 flex-col gap-2">
                    <Info size={24} />
                    <span className="text-base">ایپ کے بارے میں</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="mt-8 text-center text-muted-foreground text-sm">
        <p>"اور اللہ ہی بہتر جاننے والا ہے"</p>
      </footer>
    </div>
  );
}
