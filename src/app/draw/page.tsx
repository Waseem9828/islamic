'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BismillahButton } from '@/components/BismillahButton';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { generateIslamicRandom } from '@/lib/utils';
import Link from 'next/link';
import { Home, Redo, Share2 } from 'lucide-react';
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

  useState(() => {
    const interval = setInterval(() => {
      setPhase(p => (p < phases.length - 1 ? p + 1 : p));
    }, 550); // Made it a bit faster

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
    const text = `الحمد للہ! قرعہ کا نتیجہ:\n\n${resultNumbers.join('\n')}\n\nIslamic Random Selector ایپ کے ذریعے`;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'نتیجہ کاپی ہوگیا', description: 'اب آپ اسے کہیں بھی پیسٹ کر سکتے ہیں۔' });
    } catch (err) {
      console.error('Copy failed:', err);
      toast({ title: 'کاپی کرنے میں ناکامی', description: 'نتیجہ کاپی نہیں کیا جا سکا', variant: 'destructive'});
    }
  };

  if (step === 'animation') {
    return <NumberAnimation />;
  }

  if (step === 'result') {
    return (
       <div className="min-h-screen bg-gradient-to-b from-islamic-green to-islamic-dark flex flex-col items-center justify-center p-4">
          <h1 className="text-4xl font-arabic text-islamic-gold mb-8 animate-fade-in">
            الْحَمْدُ لِلَّهِ
          </h1>
          
          <div className="bg-white bg-opacity-20 p-8 rounded-2xl backdrop-blur-sm animate-fade-in">
            <h2 className="text-2xl font-urdu text-white text-center mb-6">
              قرعہ کا نتیجہ
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {resultNumbers.map((number, index) => (
                <div 
                  key={index}
                  style={{ animationDelay: `${index * 150}ms` }}
                  className="bg-islamic-gold text-islamic-dark text-3xl font-bold p-6 rounded-lg text-center shadow-lg transform hover:scale-110 transition-transform animate-fade-in"
                >
                  {number}
                </div>
              ))}
            </div>

            <p className="text-xl font-arabic text-islamic-gold text-center mb-6">
              فَإِنَّ اللَّهَ هُوَ الْغَنِيُّ الْحَمِيدُ
            </p>

            <div className="flex flex-col md:flex-row gap-4 justify-center">
               <Button size="lg" className="flex-1 bg-islamic-green text-white hover:bg-islamic-lightGreen font-urdu" onClick={handleShare}>
                  <Share2 className="ml-2 h-5 w-5" /> نتیجہ شیئر کریں
                </Button>
                <Button size="lg" variant="outline" className="flex-1 bg-islamic-gold text-islamic-dark hover:bg-yellow-600 font-urdu" onClick={handleRedraw}>
                  <Redo className="ml-2 h-5 w-5" /> دوبارہ قرعہ کریں
                </Button>
            </div>
             <Link href="/" passHref>
                <Button size="lg" variant="ghost" className="w-full mt-4 text-white hover:bg-islamic-gold/20 font-urdu">
                  <Home className="ml-2 h-5 w-5" /> ہوم پیج پر جائیں
                </Button>
              </Link>
          </div>
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
          <BismillahButton onClick={(e) => { e.preventDefault(); handleStartDraw(); }}>
            قرعہ شروع کریں
          </BismillahButton>
        </div>
      )}
    </div>
  );
}
