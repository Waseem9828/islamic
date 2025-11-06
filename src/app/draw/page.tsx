'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BismillahButton } from '@/components/BismillahButton';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { generateIslamicRandom } from '@/lib/utils';
import Link from 'next/link';
import { Home, Redo, Share2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type DrawStep = 'settings' | 'dua' | 'animation' | 'result';
type DrawSettings = { range: number; count: number };

function NumberAnimation() {
  const [phase, setPhase] = useState(0);

  const phases = [
    "نمبرز مکس ہو رہے ہیں...",
    "پہلا نمبر منتخب ہو رہا ہے",
    "دوسرا نمبر منتخب ہو رہا ہے", 
    "تیسرا نمبر منتخب ہو رہا ہے",
    "چوتھا نمبر منتخب ہو رہا ہے",
    "پانچواں نمبر منتخب ہو رہا ہے",
    "نتیجہ تیار ہے!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(p => (p < phases.length - 1 ? p + 1 : p));
    }, 550);

    return () => clearInterval(interval);
  }, [phases.length]);

  return (
    <div className="min-h-screen bg-islamic-dark flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-arabic text-islamic-gold mb-4 animate-pulse">
          {phases[phase]}
        </h3>
        
        <div className="flex justify-center space-x-2 mt-8">
          {[...Array(33)].map((_, i) => (
            <div 
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                i <= (phase / (phases.length -1)) * 33 ? 'bg-islamic-gold' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
        <p className="text-islamic-gold/70 mt-4 text-sm font-urdu">تسبیح کی طرح نمبرز مکس ہو رہے ہیں</p>
      </div>
    </div>
  );
}


function SettingsModal({ settings, onSave }: { settings: DrawSettings, onSave: (settings: DrawSettings) => void }) {
  const [localSettings, setLocalSettings] = useState(settings);

  return (
      <Card className="w-full max-w-lg shadow-xl animate-fade-in bg-islamic-dark border-islamic-gold">
        <CardContent className="p-8 space-y-8">
          <h2 className="font-arabic text-3xl text-center text-islamic-gold">قرعہ کی ترتیبات</h2>
          <div className="space-y-6">
            <h3 className="font-urdu text-xl text-white">نمبروں کی حد:</h3>
            <RadioGroup
              dir="ltr"
              value={String(localSettings.range)}
              onValueChange={(val) => setLocalSettings(prev => ({...prev, range: Number(val)}))}
              className="flex gap-4 justify-center"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="99" id="r1" className="text-islamic-gold border-islamic-gold" />
                <Label htmlFor="r1" className="text-lg text-white font-urdu">1 سے 99 تک</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="100" id="r2" className="text-islamic-gold border-islamic-gold" />
                <Label htmlFor="r2" className="text-lg text-white font-urdu">1 سے 100 تک</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-6">
            <h3 className="font-urdu text-xl text-white">کتنے نمبر چاہیے:</h3>
            <RadioGroup
              dir="ltr"
              value={String(localSettings.count)}
              onValueChange={(val) => setLocalSettings(prev => ({...prev, count: Number(val)}))}
              className="flex gap-4 justify-center"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4" id="c1" className="text-islamic-gold border-islamic-gold" />
                <Label htmlFor="c1" className="text-lg text-white font-urdu">4 نمبر</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="5" id="c2" className="text-islamic-gold border-islamic-gold" />
                <Label htmlFor="c2" className="text-lg text-white font-urdu">5 نمبر</Label>
              </div>
            </RadioGroup>
          </div>
          <Button size="lg" className="w-full text-lg bg-islamic-gold text-islamic-dark hover:bg-yellow-600 font-urdu" onClick={() => onSave(localSettings)}>
            محفوظ کریں
          </Button>
        </CardContent>
      </Card>
  );
}


export default function DrawPage() {
  const [step, setStep] = useState<DrawStep>('settings');
  const [settings, setSettings] = useState<DrawSettings>({ range: 99, count: 5 });
  const [resultNumbers, setResultNumbers] = useState<number[]>([]);
  const { toast } = useToast();
  const resultCardRef = useRef<HTMLDivElement>(null);

  const handleStartDraw = async () => {
    setStep('animation');
    const numbers = await generateIslamicRandom(1, settings.range, settings.count);
    setResultNumbers(numbers);
    setTimeout(() => {
        setStep('result');
    }, 4000); // Wait for animation
  };

  const handleRedraw = () => {
    setStep('settings');
    setResultNumbers([]);
  };

  const handleShare = async () => {
    const resultCard = resultCardRef.current;
    const textToCopy = `الحمد للہ! قرعہ کا نتیجہ:\n\n${resultNumbers.join(', ')}\n\nIslamic Random Selector ایپ کے ذریعے`;

    if (resultCard && typeof navigator.clipboard.write === 'function') {
        try {
            // Dynamically import html-to-image
            const { toBlob } = await import('html-to-image');
            const blob = await toBlob(resultCard, {
              backgroundColor: '#0A3A0A', // Same as islamic-dark
              pixelRatio: 2 
            });
            if (blob) {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ]);
              toast({ title: 'نتیجہ کی تصویر کاپی ہوگئی', description: 'اب آپ اسے کسی بھی ایپ میں پیسٹ کر سکتے ہیں۔' });
              return;
            }
        } catch (error) {
            console.warn('Screenshot copy failed, falling back to text copy:', error);
            // Fallback to text copy if image copy fails
        }
    }

    // Fallback for browsers that don't support image clipboard or if something fails
    try {
        await navigator.clipboard.writeText(textToCopy);
        toast({ title: 'نتیجہ کاپی ہوگیا', description: 'اب آپ اسے کہیں بھی پیسٹ کر سکتے ہیں۔' });
    } catch (err) {
        console.error('Text copy failed:', err);
        toast({ title: 'کاپی کرنے میں ناکامی', variant: 'destructive'});
    }
  };


  if (step === 'animation') {
    return <NumberAnimation />;
  }

  if (step === 'result') {
    return (
       <div className="min-h-screen bg-islamic-dark flex flex-col items-center justify-center p-4 overflow-hidden">
         <div 
            ref={resultCardRef} 
            className="w-full max-w-2xl bg-gradient-to-br from-islamic-green to-islamic-dark rounded-3xl shadow-2xl p-6 md:p-10 border-2 border-islamic-gold/50 relative animate-fade-in"
          >
            <div 
              className="absolute inset-0 opacity-5 bg-repeat bg-center"
              style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffd700' fill-opacity='0.2' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")"
              }}
            ></div>

            <div className="relative text-center">
              <h1 className="text-5xl md:text-6xl font-arabic font-bold text-islamic-gold mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                الْحَمْدُ لِلَّهِ
              </h1>
              <h2 className="text-xl font-urdu text-white mb-8">
                قرعہ کا نتیجہ آپ کے سامنے ہے
              </h2>
              
              <div className="flex justify-center items-center flex-wrap gap-3 md:gap-4 mb-8">
                {resultNumbers.map((number, index) => (
                  <div 
                    key={index}
                    style={{ animationDelay: `${index * 150}ms` }}
                    className="animate-fade-in-up bg-white/10 backdrop-blur-sm border border-islamic-gold/30 rounded-full w-20 h-20 md:w-24 md:h-24 flex items-center justify-center shadow-lg transform transition-transform hover:scale-110 hover:border-islamic-gold"
                  >
                    <span className="text-islamic-gold text-4xl md:text-5xl font-bold font-english drop-shadow-lg">{number}</span>
                  </div>
                ))}
              </div>

              <p className="text-lg md:text-xl font-arabic font-bold text-islamic-gold/80 text-center mb-10">
                فَإِنَّ اللَّهَ هُوَ الْغَنِيُّ الْحَمِيدُ
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center mt-8 w-full max-w-2xl animate-fade-in">
             <Button size="lg" className="flex-1 bg-islamic-gold text-islamic-dark hover:bg-yellow-500 font-urdu shadow-lg" onClick={handleShare}>
                <Copy className="ml-2 h-5 w-5" /> نتیجہ کاپی کریں
              </Button>
              <Button size="lg" variant="outline" className="flex-1 bg-transparent text-white border-islamic-gold hover:bg-islamic-gold hover:text-islamic-dark font-urdu shadow-lg" onClick={handleRedraw}>
                <Redo className="ml-2 h-5 w-5" /> دوبارہ قرعہ کریں
              </Button>
          </div>
           <Link href="/" passHref>
              <Button size="lg" variant="ghost" className="w-full max-w-2xl mt-4 text-white hover:bg-islamic-gold/20 font-urdu">
                <Home className="ml-2 h-5 w-5" /> ہوم پیج پر جائیں
              </Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-islamic-green flex items-center justify-center p-4">
      {step === 'settings' ? (
        <SettingsModal 
          settings={settings}
          onSave={(newSettings) => {
            setSettings(newSettings);
            setStep('dua');
          }}
        />
      ) : (
        <div className="text-center animate-fade-in">
          <h2 className="text-3xl font-arabic text-islamic-gold mb-8">
            اَللّٰهُمَّ خِرْ لِيْ وَاخْتَرْ لِيْ
          </h2>
          <p className="text-white/80 font-urdu mb-8">"اے اللہ! میرے لیے بہتر کو منتخب فرما"</p>
          <BismillahButton onClick={handleStartDraw}>
            قرعہ شروع کریں
          </BismillahButton>
        </div>
      )}
    </div>
  );
}
