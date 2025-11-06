'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowRight, BookOpen, Check, Home, Redo, Share2 } from 'lucide-react';
import { generateUniqueRandomNumbers } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

type DrawStep = 'dua' | 'settings' | 'animation' | 'result';
type DrawSettings = { range: number; count: number };

function NumberSpinner() {
  const [digit, setDigit] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDigit(d => (d + 1) % 10);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return <span className="text-4xl font-mono text-muted-foreground animate-pulse">{digit}</span>;
}

export default function DrawPage() {
  const [step, setStep] = useState<DrawStep>('dua');
  const [settings, setSettings] = useState<DrawSettings>({ range: 99, count: 4 });
  const [resultNumbers, setResultNumbers] = useState<number[]>([]);
  const [revealedNumbers, setRevealedNumbers] = useState<(number | null)[]>([]);
  const { toast } = useToast();

  const handleSettingsChange = (type: 'range' | 'count', value: number) => {
    setSettings(prev => ({ ...prev, [type]: value }));
  };

  const handleStartDraw = () => {
    const numbers = generateUniqueRandomNumbers(settings.range, settings.count);
    setResultNumbers(numbers);
    setRevealedNumbers(Array(settings.count).fill(null));
    setStep('animation');
  };

  const handleRedraw = () => {
    setStep('settings');
  };

  const handleShare = async () => {
    const text = `الحمد للہ! قرعہ کا نتیجہ:\n\n${resultNumbers.join('\n')}\n\nIslamic Random Selector ایپ کے ذریعے`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'قرعہ کا نتیجہ',
          text: text,
        });
      } catch (error) {
        console.error('Share failed:', error);
        toast({ title: 'شیئرنگ میں ناکامی', description: 'نتیجہ شیئر نہیں کیا جا سکا', variant: 'destructive'});
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: 'نتیجہ کاپی ہوگیا', description: 'اب آپ اسے کہیں بھی پیسٹ کر سکتے ہیں۔' });
      } catch (err) {
        toast({ title: 'کاپی کرنے میں ناکامی', description: 'نتیجہ کاپی نہیں کیا جا سکا', variant: 'destructive'});
      }
    }
  };

  useEffect(() => {
    if (step === 'animation') {
      const revealNextNumber = (index: number) => {
        if (index < resultNumbers.length) {
          setTimeout(() => {
            setRevealedNumbers(prev => {
              const newRevealed = [...prev];
              newRevealed[index] = resultNumbers[index];
              return newRevealed;
            });
            revealNextNumber(index + 1);
          }, 2000);
        } else {
          setTimeout(() => {
            setStep('result');
          }, 1000);
        }
      };
      revealNextNumber(0);
    }
  }, [step, resultNumbers]);

  const renderStep = () => {
    switch (step) {
      case 'dua':
        return (
          <Card className="w-full max-w-lg text-center shadow-xl animate-fade-in">
            <CardContent className="p-8 sm:p-12 space-y-6">
              <BookOpen className="mx-auto h-16 w-16 text-primary" />
              <h2 className="font-headline text-4xl text-primary">اَللّٰهُمَّ خِرْ لِيْ وَاخْتَرْ لِيْ</h2>
              <p className="text-muted-foreground text-lg">"اے اللہ! میرے لیے بہتر کو منتخب فرما"</p>
              <Button size="lg" className="w-full text-lg" onClick={() => setStep('settings')}>
                آمادہ ہوں - اگلا مرحلہ <ArrowRight className="mr-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        );
      case 'settings':
        return (
          <Card className="w-full max-w-lg shadow-xl animate-fade-in">
            <CardContent className="p-8 space-y-8">
              <h2 className="font-headline text-3xl text-center text-primary">قرعہ کی ترتیبات</h2>
              <div className="space-y-6">
                <h3 className="font-headline text-xl">نمبروں کی حد:</h3>
                <RadioGroup
                  dir="ltr"
                  value={String(settings.range)}
                  onValueChange={(val) => handleSettingsChange('range', Number(val))}
                  className="flex gap-4 justify-center"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="99" id="r1" />
                    <Label htmlFor="r1" className="text-lg">1 سے 99 تک</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="100" id="r2" />
                    <Label htmlFor="r2" className="text-lg">1 سے 100 تک</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-6">
                <h3 className="font-headline text-xl">کتنے نمبر چاہیے:</h3>
                <RadioGroup
                  dir="ltr"
                  value={String(settings.count)}
                  onValueChange={(val) => handleSettingsChange('count', Number(val))}
                  className="flex gap-4 justify-center"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="4" id="c1" />
                    <Label htmlFor="c1" className="text-lg">4 نمبر</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="5" id="c2" />
                    <Label htmlFor="c2" className="text-lg">5 نمبر</Label>
                  </div>
                </RadioGroup>
              </div>
              <Button size="lg" className="w-full text-lg" onClick={handleStartDraw}>
                قرعہ شروع کریں
              </Button>
            </CardContent>
          </Card>
        );
      case 'animation':
        return (
          <div className="w-full max-w-2xl text-center animate-fade-in">
             <h2 className="font-headline text-3xl text-primary mb-6">نمبرز مکس ہو رہے ہیں...</h2>
             <div dir="ltr" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 justify-center">
                {revealedNumbers.map((num, index) => (
                    <Card key={index} className={`flex flex-col items-center justify-center p-4 h-40 transition-all duration-500 ${num !== null ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                        {num !== null ? (
                            <div className="text-center animate-fade-in">
                               <p className="text-4xl font-bold">{num}</p>
                               <p className="text-sm font-headline mt-2 flex items-center gap-1"><Check size={16}/> الحمد للہ</p>
                            </div>
                        ) : (
                           <div className="flex gap-1">
                             <NumberSpinner />
                             <NumberSpinner />
                           </div>
                        )}
                    </Card>
                ))}
             </div>
          </div>
        );
      case 'result':
        return (
          <Card className="w-full max-w-lg text-center shadow-xl animate-fade-in">
            <CardContent className="p-8 space-y-6">
              <h2 className="font-headline text-3xl text-primary">🎉 الحمد للہ! قرعہ کا نتیجہ</h2>
              <p className="font-headline text-lg text-muted-foreground">منتخب نمبر:</p>
              <div className="flex flex-wrap justify-center gap-4 py-4">
                {resultNumbers.map((num, index) => (
                  <div key={index} className="flex items-center gap-2 bg-accent/20 border-2 border-accent text-accent-foreground rounded-lg p-3 shadow-md">
                    <span className="font-bold text-3xl">📌 {num}</span>
                  </div>
                ))}
              </div>
              <p className="font-headline text-xl text-primary">"فَإِنَّ اللَّهَ هُوَ الْغَنِيُّ الْحَمِيدُ"</p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="flex-1" onClick={handleShare}>
                  <Share2 className="ml-2 h-5 w-5" /> نتیجہ شیئر کریں
                </Button>
                <Button size="lg" variant="outline" className="flex-1" onClick={handleRedraw}>
                  <Redo className="ml-2 h-5 w-5" /> دوبارہ قرعہ کریں
                </Button>
              </div>
              <Link href="/" passHref>
                <Button size="lg" variant="ghost" className="w-full mt-2">
                  <Home className="ml-2 h-5 w-5" /> ہوم پیج پر جائیں
                </Button>
              </Link>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      {renderStep()}
    </div>
  );
}
