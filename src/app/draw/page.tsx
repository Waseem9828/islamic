'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BismillahButton } from '@/components/BismillahButton';
import { generateIslamicRandom } from '@/lib/utils';
import { Redo, Share2, Send } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { useAdmin } from '@/hooks/use-admin';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useGroups } from '@/hooks/use-groups';
import { Button } from '@/components/ui/button';


type DrawStep = 'settings' | 'dua' | 'animation' | 'result';

// --- Settings Modal ---
const SettingsModal = ({ onSave, onClose, initialSettings }: { onSave: (settings: any) => void, onClose: () => void, initialSettings: any }) => {
  const [settings, setSettings] = useState(initialSettings);

  const ranges = [
    { value: '1-33', label: '1 to 33' },
    { value: '1-66', label: '1 to 66' },
    { value: '1-99', label: '1 to 99' },
  ];

  const methods = [
    { value: 'automatic', label: 'Automatic Method', desc: 'Mixed 33 times' },
    { value: 'stepwise', label: 'Step by Step', desc: 'Each number separately' },
    { value: 'tasbih', label: 'Tasbih Method', desc: 'Like 33 beads' }
  ];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-3xl p-8 max-w-md w-full border">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">
            Select Settings
          </h2>
          <p className="text-muted-foreground">Choose the draw settings</p>
        </div>
        <div className="mb-6">
          <label className="block text-foreground mb-3 text-left">Number Range:</label>
          <div className="grid grid-cols-3 gap-3">
            {ranges.map((range) => (
              <button key={range.value} onClick={() => setSettings({ ...settings, range: range.value })}
                className={`p-3 rounded-xl border-2 transition-all ${settings.range === range.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border hover:bg-accent'}`}>
                <div className="text-sm">{range.label}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-foreground mb-3 text-left">How many numbers:</label>
          <div className="flex gap-2 flex-wrap justify-center">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <button key={num} onClick={() => setSettings({ ...settings, count: num })}
                className={`w-12 h-12 rounded-full border-2 text-lg font-bold transition-all ${settings.count === num ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border hover:bg-accent'}`}>
                {num}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-8">
          <label className="block text-foreground mb-3 text-left">Method:</label>
          <div className="space-y-3">
            {methods.map((method) => (
              <div key={method.value} onClick={() => setSettings({ ...settings, method: method.value })}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${settings.method === method.value ? 'bg-primary/20 border-primary' : 'bg-secondary border-border hover:bg-accent'}`}>
                <div className="font-bold text-foreground text-left">{method.label}</div>
                <div className="text-muted-foreground text-xs text-left mt-1">{method.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-xl hover:bg-accent transition-colors">Cancel</button>
          <button onClick={() => onSave(settings)} className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary/90 transition-colors font-bold">Save</button>
        </div>
      </div>
    </div>
  );
};

// --- Result Display ---
const ResultDisplay = ({ numbers, settings, onRestart, onHome }: { numbers: number[], settings: any, onRestart: () => void, onHome: () => void }) => {
    const { toast } = useToast();
    const resultCardRef = useRef<HTMLDivElement>(null);
    const { user } = useUser();
    const firestore = useFirestore();
    const { groups, isLoading: areGroupsLoading } = useGroups();
    const [isSaving, setIsSaving] = useState(false);

    const handleShare = async () => {
        if (!resultCardRef.current) return;

        try {
            const canvas = await html2canvas(resultCardRef.current, {
                backgroundColor: null,
                useCORS: true,
            });
            const dataUrl = canvas.toDataURL('image/png');
            
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'qurah-result.png', { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Draw Result',
                    text: `The draw result is: ${numbers.join(', ')}`,
                });
            } else {
                 await navigator.clipboard.write([
                    new ClipboardItem({
                        'image/png': blob
                    })
                ]);
                toast({
                    title: "Result Copied!",
                    description: "Screenshot has been copied to the clipboard.",
                });
            }
        } catch (err) {
            console.error('Sharing or copying screenshot failed:', err);
            const text = numbers.join(', ');
            await navigator.clipboard.writeText(text);
            toast({
                title: "Only text copied",
                description: "Screenshot could not be shared, only the result was copied.",
                variant: "destructive",
            });
        }
    };
    
    const handleSendToGroup = async (groupId: string, groupName: string) => {
        if (!user || isSaving) return;
        setIsSaving(true);
        try {
            const drawDocRef = await addDoc(collection(firestore, 'draws'), {
                adminId: user.uid,
                drawTime: serverTimestamp(),
                settings: settings,
            });

            await addDoc(collection(firestore, 'draws', drawDocRef.id, 'draw_results'), {
                groupId: groupId,
                selectedNumbers: numbers,
            });

            toast({
                title: "Result Sent!",
                description: `The draw result has been successfully sent to the "${groupName}" group.`,
            });
            onRestart();
        } catch (error) {
            console.error("Error sending draw result: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "An issue occurred while sending the result.",
            });
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div ref={resultCardRef} className="bg-card rounded-3xl p-8 mb-8 border w-full max-w-4xl">
                 <header className="mb-8 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-primary mb-2">
                        Alhamdulillah
                    </h1>
                    <p className="text-2xl text-foreground">Draw Result</p>
                </header>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
                    {numbers.map((number, index) => (
                        <div key={index} className="relative group">
                            <div className="bg-primary text-primary-foreground text-4xl font-bold p-6 rounded-2xl shadow-2xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 border-4 border-card">
                                {number}
                            </div>
                            <div className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground text-sm rounded-full w-8 h-8 flex items-center justify-center border-2 border-card font-bold">
                                {index + 1}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mb-6 text-center">
                    <p className="text-2xl text-primary leading-relaxed font-bold">
                        "Indeed, Allah is the Free of need, the Praiseworthy."
                    </p>
                </div>
                 <div className="bg-secondary rounded-2xl p-4 mt-6">
                    <div className="flex justify-around items-center text-sm text-secondary-foreground">
                        <div><span className="font-bold">Range: </span><span>{settings.range}</span></div>
                        <div><span className="font-bold">Count: </span><span>{settings.count}</span></div>
                        <div>
                            <span className="font-bold">Method: </span>
                            <span>{settings.method}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full max-w-4xl mb-8">
                <h3 className="text-xl font-bold text-center text-primary mb-4">Send Result to Group</h3>
                {areGroupsLoading ? (
                     <div className="text-center text-foreground">Loading groups...</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {groups.map((group) => (
                            <button
                                key={group.id}
                                onClick={() => handleSendToGroup(group.id, group.name)}
                                disabled={isSaving}
                                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-6 py-4 rounded-xl text-lg flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                <Send size={20} /> {group.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center w-full max-w-4xl">
                <Button onClick={handleShare} variant="secondary" className="flex-1 px-8 py-4 rounded-2xl text-lg flex items-center justify-center gap-3">
                    <Share2 size={20} /> Share Result
                </Button>
                <Button onClick={onRestart} className="flex-1 px-8 py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3">
                    <Redo size={20} /> Draw Again
                </Button>
            </div>
            <footer className="mt-12 text-center">
                <p className="text-muted-foreground text-sm">May Allah ease all your tasks</p>
            </footer>
        </div>
    );
};


// --- Draw Animation ---
const NumberAnimation = ({ settings, onComplete }: { settings: any, onComplete: (numbers: number[]) => void }) => {
    const [currentNumbers, setCurrentNumbers] = useState<number[]>([]);
    const [phase, setPhase] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    const phases = [
        { text: "Mixing numbers...", duration: 2000 },
        { text: "Selecting first number", duration: 1500 },
        { text: "Selecting second number", duration: 1500 },
        { text: "Selecting third number", duration: 1500 },
        { text: "Selecting fourth number", duration: 1500 },
        { text: "Selecting fifth number", duration: 1500 },
        { text: "Selecting sixth number", duration: 1500 },
        { text: "Selecting seventh number", duration: 1500 },
        { text: "Selecting eighth number", duration: 1500 },
        { text: "Selecting ninth number", duration: 1500 },
        { text: "Selecting tenth number", duration: 1500 },
        { text: "Completed!", duration: 1000 }
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

        const duration = (phases[phase] && phases[phase].duration) ? phases[phase].duration : 1000;
        const phaseTimer = setTimeout(() => {
            if (phase < settings.count) {
                const [min, max] = settings.range.split('-').map(Number);
                const newNumber = Math.floor(Math.random() * (max - min + 1)) + min;
                setCurrentNumbers(prev => [...prev, newNumber]);
                setPhase(prev => prev + 1);
            }
        }, duration);

        return () => clearTimeout(phaseTimer);
    }, [phase, settings, isComplete, onComplete]);


    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="absolute top-8 text-6xl text-primary opacity-20">﷽</div>
            <div className="text-center max-w-2xl w-full">
                <div className="mb-12">
                    <h3 className="text-3xl text-primary mb-4">
                        {(phases[phase] && phases[phase].text) || "Completed!"}
                    </h3>
                    <div className="flex justify-center items-center space-x-2 mb-8">
                        {[...Array(33)].map((_, i) => (
                            <div key={i} className={`w-3 h-3 rounded-full transition-all duration-500 ${i <= phase * (33 / settings.count) ? 'bg-primary scale-125' : 'bg-muted scale-100'}`} />
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
                    {currentNumbers.map((num, index) => (
                        <div key={index} className="relative overflow-hidden bg-primary text-primary-foreground text-3xl font-bold p-6 rounded-2xl shadow-2xl transform transition-all duration-500 hover:scale-110 hover:rotate-3 border-4 border-card animate-bounce">
                            <span className="relative z-10">{num}</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                        </div>
                    ))}
                    {Array.from({ length: settings.count - currentNumbers.length }).map((_, index) => (
                        <div key={`empty-${index}`} className="bg-secondary border-2 border-dashed border-border text-foreground text-3xl p-6 rounded-2xl animate-pulse flex items-center justify-center">?</div>
                    ))}
                </div>
                <div className="bg-secondary backdrop-blur-sm rounded-2xl p-6 border">
                    <p className="text-xl text-primary mb-2">{phase < settings.count ? "O Allah, choose for me and select for me." : "All praise is for Allah."}</p>
                    <p className="text-foreground">{phase < settings.count ? "Ya Allah! Mere liye behtar ko muntakhab farma." : "Sab ta'areef Allah ke liye hai."}</p>
                </div>
                <div className="mt-8 bg-secondary rounded-full h-3 overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${((phase + 1) / (settings.count + 1)) * 100}%` }}></div>
                </div>
            </div>
        </div>
    );
};


// --- Main Draw Page ---
export default function DrawPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { isAdmin, isAdminLoading } = useAdmin();
  const [step, setStep] = useState<DrawStep>('settings');
  const [settings, setSettings] = useState({ range: '1-99', count: 5, method: 'automatic' });
  const [resultNumbers, setResultNumbers] = useState<number[]>([]);

  useEffect(() => {
    if (!isUserLoading && !isAdminLoading) {
      if (!user || !isAdmin) {
        router.push('/');
      }
    }
  }, [user, isUserLoading, isAdmin, isAdminLoading, router]);

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
    router.push('/admin');
  };
  
  if (isUserLoading || isAdminLoading) {
    return <div className="flex justify-center items-center min-h-screen"><div>Loading Admin...</div></div>;
  }

  if (!isAdmin) {
    return <div className="flex justify-center items-center min-h-screen"><div>Access Denied.</div></div>;
  }


  const renderStep = () => {
    switch (step) {
      case 'settings':
        return <SettingsModal onSave={handleSettingsSave} onClose={() => router.push('/admin')} initialSettings={settings} />;
      case 'dua':
        return (
          <div className="flex flex-col items-center justify-center p-4 text-center">
             <div className="bg-secondary backdrop-blur-sm rounded-3xl p-8 mb-12 border">
                <p className="text-2xl md:text-4xl text-primary leading-relaxed">
                    O Allah, choose for me and select for me.
                </p>
                <p className="text-lg md:text-xl text-foreground mt-4">
                    "O Allah! Choose for me and select for me."
                </p>
            </div>
            <BismillahButton onClick={handleDuaContinue}>
              Start Draw
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

  return <div className="min-h-full flex items-center justify-center">{renderStep()}</div>;
}
