import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BismillahButton } from '@/components/BismillahButton';
import { Clock, HeartHandshake, Info, Mosque } from 'lucide-react';

const PrayerDisplay = () => {
  // Dummy data for now
  return (
    <div className="absolute bottom-4 right-4 bg-black/30 p-3 rounded-lg text-white font-urdu text-sm">
      <p>اگلی نماز: مغرب 6:45 PM</p>
    </div>
  );
};

export default function Home() {
  return (
    <>
      <div 
        className="absolute inset-0 opacity-10 bg-[url('/images/pattern.png')]"
        style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffd700' fill-opacity='0.1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")"
        }}
      ></div>

      <main className="min-h-screen bg-gradient-to-b from-islamic-green to-islamic-dark flex flex-col items-center justify-center p-4 relative">
        
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-arabic text-islamic-gold mb-4">
            الْقُرْعَةُ الْإِسْلَامِيَّةُ
          </h1>
          <p className="text-white text-xl font-urdu">
            اسلامی طریقے سے قرعہ اندازی
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <BismillahButton 
            href="/draw"
            className="md:col-span-2 w-full"
          >
            شروع کریں بِسْمِ اللَّهِ
          </BismillahButton>

          <Link href="/prayer-times" passHref>
             <Button variant="outline" className="w-full h-24 flex-col gap-2 bg-islamic-gold text-islamic-dark hover:bg-yellow-600 transition-colors">
              <Clock size={24} />
              <span className="text-base font-urdu">نماز کے اوقات</span>
            </Button>
          </Link>

          <Link href="/sadaqah" passHref>
             <Button variant="outline" className="w-full h-24 flex-col gap-2 bg-islamic-cream text-islamic-green hover:bg-cream-200 transition-colors">
              <HeartHandshake size={24} />
              <span className="text-base font-urdu">صدقہ کے فضائل</span>
            </Button>
          </Link>
          
          <Link href="/about" passHref>
            <Button variant="outline" className="w-full h-24 flex-col gap-2 bg-white text-islamic-green hover:bg-gray-100 transition-colors">
              <Info size={24} />
              <span className="text-base font-urdu">ایپ کے بارے میں</span>
            </Button>
          </Link>
        </div>

        <PrayerDisplay />
      </main>
    </>
  );
}
