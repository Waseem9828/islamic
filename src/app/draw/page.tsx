'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BismillahButton } from '@/components/BismillahButton';
import { generateIslamicRandom } from '@/lib/utils';
import Link from 'next/link';
import { Home, Redo, Share2, Copy } from 'lucide-react';

type DrawStep = 'settings' | 'dua' | 'animation' | 'result';

// --- سیٹنگز موڈل ---
const SettingsModal = ({ onSave, onClose, initialSettings }: { onSave: (settings: any) => void, onClose: () => void, initialSettings: any }) => {
  const [settings, setSettings] = useState(initialSettings);

  const ranges = [
    { value: '1-33', label: '1 سے 33 تک' },
    { value: '1-66', label: '1 سے 66 تک' },
    { value: '1-99', label: '1 سے 99 تک' },
    { value: '1-100', label: '1 سے 100 تک' }
  ];

  const methods = [
    { value: 'automatic', label: 'خودکار طریقہ', desc: '33 بار مکس ہو کر' },
    { value: 'stepwise', label: 'قدم بہ قدم', desc: 'ہر نمبر الگ سے' },
    { value: 'tasbih', label: 'تسبیح والا طریقہ', desc: '33 دانوں کی طرح' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-islamic-dark to-islamic-green rounded-3xl p-8 max-w-md w-full border-2 border-islamic-gold">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-arabic text-islamic-gold mb-2">
            إخْتَرْ الْإِعدادَات
          </h2>
          <p className="text-white font-urdu">قرعہ کی ترتیبات منتخب کریں</p>
        </div>
        <div className="mb-6">
          <label className="block text-white font-urdu mb-3 text-right">نمبروں کی حد:</label>
          <div className="grid grid-cols-2 gap-3">
            {ranges.map((range) => (
              <button key={range.value} onClick={() => setSettings({ ...settings, range: range.value })}
                className={`p-3 rounded-xl border-2 transition-all ${settings.range === range.value ? 'bg-islamic-gold text-islamic-dark border-islamic-gold' : 'bg-white bg-opacity-10 text-white border-white border-opacity-20 hover:bg-opacity-20'}`}>
                <div className="font-urdu text-sm">{range.label}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-white font-urdu mb-3 text-right">کتنے نمبر چاہیے:</label>
          <div className="flex gap-3 justify-center">
            {[3, 4, 5, 7].map((num) => (
              <button key={num} onClick={() => setSettings({ ...settings, count: num })}
                className={`w-12 h-12 rounded-full border-2 text-lg font-bold transition-all ${settings.count === num ? 'bg-islamic-gold text-islamic-dark border-islamic-gold' : 'bg-white bg-opacity-10 text-white border-white border-opacity-20 hover:bg-opacity-20'}`}>
                {num}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-8">
          <label className="block text-white font-urdu mb-3 text-right">طریقہ کار:</label>
          <div className="space-y-3">
            {methods.map((method) => (
              <div key={method.value} onClick={() => setSettings({ ...settings, method: method.value })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${settings.method === method.value ? 'bg-islamic-green border-islamic-gold' : 'bg-white bg-opacity-10 border-white border-opacity-20 hover:bg-opacity-20'}`}>
                <div className="font-urdu text-white text-right">{method.label}</div>
                <div className="text-islamic-cream text-xs text-right mt-1">{method.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 bg-white bg-opacity-20 text-white py-3 rounded-xl hover:bg-opacity-30 transition-colors font-urdu">منسوخ کریں</button>
          <button onClick={() => onSave(settings)} className="flex-1 bg-islamic-gold text-islamic-dark py-3 rounded-xl hover:bg-yellow-600 transition-colors font-urdu font-bold">محفوظ کریں</button>
        </div>
      </div>
    </div>
  );
};

// --- نتیجہ ڈسپلے ---
const ResultDisplay = ({ numbers, settings, onRestart, onHome }: { numbers: number[], settings: any, onRestart: () => void, onHome: () => void }) => {
    const [showCopySuccess, setShowCopySuccess] = useState(false);

    const copyToClipboard = async () => {
        const text = numbers.join(', ');
        try {
            await navigator.clipboard.writeText(text);
            setShowCopySuccess(true);
            setTimeout(() => setShowCopySuccess(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const handleShare = async () => {
        const text = `قرعہ کا نتیجہ: ${numbers.join(', ')}\n\nبسم اللہ کے ساتھ اسلامی قرعہ اندازی`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'قرعہ کا نتیجہ',
                    text: text,
                });
            } catch (err) {
                console.error('Sharing failed:', err);
            }
        } else {
            copyToClipboard();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-islamic-green to-islamic-dark flex flex-col items-center justify-center p-4">
            <div className="absolute top-8 text-6xl text-islamic-gold opacity-20">﷽</div>
            <div className="absolute bottom-8 text-6xl text-islamic-gold opacity-20">﷽</div>
            <div className="text-center max-w-4xl w-full">
                <header className="mb-8">
                    <h1 className="text-4xl md:text-6xl font-arabic text-islamic-gold mb-4">الْحَمْدُ لِلَّهِ</h1>
                    <p className="text-2xl text-white font-urdu">قرعہ کا نتیجہ</p>
                </header>
                <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-3xl p-8 mb-8 border-2 border-islamic-gold border-opacity-40">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        {numbers.map((number, index) => (
                            <div key={index} className="relative group">
                                <div className="bg-gradient-to-br from-islamic-gold to-yellow-400 text-islamic-dark text-4xl font-bold p-6 rounded-2xl shadow-2xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 border-4 border-white">
                                    {number}
                                </div>
                                <div className="absolute -top-2 -right-2 bg-islamic-green text-white text-sm rounded-full w-8 h-8 flex items-center justify-center border-2 border-white">
                                    {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mb-6">
                        <p className="text-2xl font-arabic text-islamic-gold leading-relaxed">فَإِنَّ اللَّهَ هُوَ الْغَنِيُّ الْحَمِيدُ</p>
                        <p className="text-white font-urdu mt-2">"بے شک اللہ بے نیاز اور قابل تعریف ہے"</p>
                    </div>
                    <div className="bg-white bg-opacity-10 rounded-2xl p-4 mb-6">
                        <div className="flex justify-between text-sm text-white">
                            <span className="font-urdu">حد:</span><span>{settings.range}</span>
                            <span className="font-urdu">تعداد:</span><span>{settings.count}</span>
                            <span className="font-urdu">طریقہ:</span>
                            <span className="font-urdu">{settings.method === 'automatic' ? 'خودکار' : settings.method === 'stepwise' ? 'قدم بہ قدم' : 'تسبیح'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
                    <button onClick={handleShare} className="bg-islamic-green text-white px-8 py-4 rounded-2xl hover:bg-islamic-lightGreen transition-colors font-urdu text-lg flex items-center justify-center gap-3">
                        <Share2 size={20} /> نتیجہ شیئر کریں
                        {showCopySuccess && (<span className="text-islamic-gold text-sm animate-pulse">کاپی ہو گیا!</span>)}
                    </button>
                    <button onClick={onRestart} className="bg-islamic-gold text-islamic-dark px-8 py-4 rounded-2xl hover:bg-yellow-600 transition-colors font-urdu text-lg font-bold flex items-center justify-center gap-3">
                        <Redo size={20} /> دوبارہ قرعہ کریں
                    </button>
                </div>
                <button onClick={onHome} className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-xl hover:bg-opacity-30 transition-colors font-urdu flex items-center justify-center gap-2">
                    <Home size={20} /> ہوم پیج پر جائیں
                </button>
            </div>
            <footer className="mt-12 text-center">
                <p className="text-islamic-cream opacity-70 text-sm font-urdu">اللہ آپ کے ہر کام میں آسانی پیدا فرمائے</p>
            </footer>
        </div>
    );
};


// --- قرعہ اینیمیشن ---
const NumberAnimation = ({ settings, onComplete }: { settings: any, onComplete: (numbers: number[]) => void }) => {
    const [currentNumbers, setCurrentNumbers] = useState<number[]>([]);
    const [phase, setPhase] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    const phases = [
        { text: "نمبرز مکس ہو رہے ہیں...", duration: 2000 },
        { text: "پہلا نمبر منتخب ہو رہا ہے", duration: 1500 },
        { text: "دوسرا نمبر منتخب ہو رہا ہے", duration: 1500 },
        { text: "تیسرا نمبر منتخب ہو رہا ہے", duration: 1500 },
        { text: "چوتھا نمبر منتخب ہو رہا ہے", duration: 1500 },
        { text: "پانچواں نمبر منتخب ہو رہا ہے", duration: 1500 },
        { text: "چھٹا نمبر منتخب ہو رہا ہے", duration: 1500 },
        { text: "ساتواں نمبر منتخب ہو رہا ہے", duration: 1500 },
        { text: "مکمل ہو گیا!", duration: 1000 }
    ];

    useEffect(() => {
        if (phase >= settings.count) {
            if (!isComplete) {
                setIsComplete(true);
                generateIslamicRandom(parseInt(settings.range.split('-')[0]), parseInt(settings.range.split('-')[1]), settings.count)
                    .then(finalNumbers => {
                        setTimeout(() => {
                            onComplete(finalNumbers);
                        }, 1000);
                    });
            }
            return;
        }

        const phaseTimer = setTimeout(() => {
            if (phase < settings.count) {
                const [min, max] = settings.range.split('-').map(Number);
                const newNumber = Math.floor(Math.random() * (max - min + 1)) + min;
                setCurrentNumbers(prev => [...prev, newNumber]);
                setPhase(prev => prev + 1);
            }
        }, phases[phase]?.duration || 1000);

        return () => clearTimeout(phaseTimer);
    }, [phase, settings, isComplete, onComplete]);


    return (
        <div className="min-h-screen bg-gradient-to-br from-islamic-dark to-islamic-green flex flex-col items-center justify-center p-4">
            <div className="absolute top-8 text-6xl text-islamic-gold opacity-20">﷽</div>
            <div className="text-center max-w-2xl w-full">
                <div className="mb-12">
                    <h3 className="text-3xl font-arabic text-islamic-gold mb-4">
                        {phases[phase]?.text || "مکمل ہو گیا!"}
                    </h3>
                    <div className="flex justify-center items-center space-x-2 mb-8">
                        {[...Array(33)].map((_, i) => (
                            <div key={i} className={`w-3 h-3 rounded-full transition-all duration-500 ${i <= phase * (33 / settings.count) ? 'bg-islamic-gold scale-125' : 'bg-white bg-opacity-30 scale-100'}`} />
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12" style={{ direction: 'ltr' }}>
                    {currentNumbers.map((num, index) => (
                        <div key={index} className="relative overflow-hidden bg-gradient-to-br from-islamic-gold to-yellow-400 text-islamic-dark text-3xl font-bold p-6 rounded-2xl shadow-2xl transform transition-all duration-500 hover:scale-110 hover:rotate-3 border-4 border-white animate-bounce">
                            <span className="relative z-10">{num}</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                        </div>
                    ))}
                    {Array.from({ length: settings.count - currentNumbers.length }).map((_, index) => (
                        <div key={`empty-${index}`} className="bg-white bg-opacity-10 border-2 border-dashed border-white border-opacity-30 text-white text-3xl p-6 rounded-2xl animate-pulse flex items-center justify-center">?</div>
                    ))}
                </div>
                <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-2xl p-6 border border-islamic-gold border-opacity-30">
                    <p className="text-xl font-arabic text-islamic-gold mb-2">{phase < settings.count ? "اَللّٰهُمَّ خِرْ لِيْ وَاخْتَرْ لِيْ" : "الْحَمْدُ لِلَّهِ"}</p>
                    <p className="text-white font-urdu">{phase < settings.count ? "یا اللہ! میرے لیے بہتر منتخب فرما" : "سب تعریف اللہ کے لیے ہے"}</p>
                </div>
                <div className="mt-8 bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
                    <div className="bg-islamic-gold h-full rounded-full transition-all duration-1000" style={{ width: `${((phase + 1) / (settings.count + 1)) * 100}%` }}></div>
                </div>
            </div>
        </div>
    );
};


// --- مین ڈرا پیج ---
export default function DrawPage() {
  const router = useRouter();
  const [step, setStep] = useState<DrawStep>('settings');
  const [settings, setSettings] = useState({ range: '1-99', count: 5, method: 'automatic' });
  const [resultNumbers, setResultNumbers] = useState<number[]>([]);

  const handleSettingsSave = (newSettings: any) => {
    setSettings(newSettings);
    setStep('dua');
  };

  const handleDuaContinue = () => {
    setStep('animation');
  };

  const handleAnimationComplete = (numbers: number[]) => {
    setResultNumbers(numbers);
    setStep('result');
  };

  const handleRestart = () => {
    setStep('settings');
    setResultNumbers([]);
  };

  const handleGoHome = () => {
    router.push('/');
  };


  const renderStep = () => {
    switch (step) {
      case 'settings':
        return <SettingsModal onSave={handleSettingsSave} onClose={() => router.push('/')} initialSettings={settings} />;
      case 'dua':
        return (
          <div className="min-h-screen bg-islamic-green flex flex-col items-center justify-center p-4 text-center">
             <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-3xl p-8 mb-12 border border-islamic-gold border-opacity-30">
                <p className="text-2xl md:text-4xl font-arabic text-islamic-gold leading-relaxed">
                    اَللّٰهُمَّ خِرْ لِيْ وَاخْتَرْ لِيْ
                </p>
                <p className="text-lg md:text-xl text-white mt-4 font-urdu">
                    "یا اللہ! میرے لیے بہتر کو منتخب فرما"
                </p>
            </div>
            <BismillahButton onClick={handleDuaContinue}>
              قرعہ شروع کریں
            </BismillahButton>
          </div>
        );
      case 'animation':
        return <NumberAnimation settings={settings} onComplete={handleAnimationComplete} />;
      case 'result':
        return <ResultDisplay numbers={resultNumbers} settings={settings} onRestart={handleRestart} onHome={handleGoHome} />;
      default:
        return null;
    }
  };

  return <>{renderStep()}</>;
}
