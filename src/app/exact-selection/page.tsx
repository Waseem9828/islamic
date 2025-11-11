'use client';
import { useState, useEffect } from 'react';
import { generateIslamicRandom } from '@/lib/utils';
import { BismillahButton } from '@/components/BismillahButton';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/hooks/use-admin';


// --- Three-Stage Draw Method Component ---
const ThreeStageDraw = () => {
    const [stage, setStage] = useState(0); // 0: Start, 1: R1, 2: R2, 3: R3, 4: Consolidate, 5: Final, 6: Complete
    const [round1Numbers, setRound1Numbers] = useState<number[]>([]);
    const [round2Numbers, setRound2Numbers] = useState<number[]>([]);
    const [round3Numbers, setRound3Numbers] = useState<number[]>([]);
    const [consolidatedNumbers, setConsolidatedNumbers] = useState<number[]>([]);
    const [finalFive, setFinalFive] = useState<number[]>([]);
    const [exactNumber, setExactNumber] = useState<number | null>(null);

    const startDraw = async () => {
        if (stage === 0) {
            const r1 = await generateIslamicRandom(1, 99, 5);
            setRound1Numbers(r1);
            setStage(1);
        } else if (stage === 1) {
            const r2 = await generateIslamicRandom(1, 99, 5);
            setRound2Numbers(r2);
            setStage(2);
        } else if (stage === 2) {
            const r3 = await generateIslamicRandom(1, 99, 5);
            setRound3Numbers(r3);
            setStage(3);
        } else if (stage === 3) {
            const all15 = [...round1Numbers, ...round2Numbers, ...round3Numbers];
            setConsolidatedNumbers(all15);
            const final5 = await customGenerateRandom(0, all15.length - 1, 5, all15);
            setFinalFive(final5);
            setStage(4);
        } else if (stage === 4) {
            const final1 = await customGenerateRandom(0, finalFive.length - 1, 1, finalFive);
            setExactNumber(final1[0]);
            setStage(5);
        }
    };
    
    const customGenerateRandom = (min: number, max: number, count: number, sourceArray: number[]): Promise<number[]> => {
        return new Promise((resolve) => {
            const shuffled = [...sourceArray].sort(() => 0.5 - Math.random());
            resolve(shuffled.slice(0, count));
        });
    };


    const resetProcess = () => {
        setStage(0);
        setRound1Numbers([]);
        setRound2Numbers([]);
        setRound3Numbers([]);
        setConsolidatedNumbers([]);
        setFinalFive([]);
        setExactNumber(null);
    };

    const getStageDescription = () => {
        switch (stage) {
            case 0: return "Start the three-stage draw.";
            case 1: return "First stage complete. Now start the second stage.";
            case 2: return "Second stage complete. Now start the third stage.";
            case 3: return "All three stages complete. Now select 5 from the 15 numbers.";
            case 4: return "5 numbers selected. Now select the final number from them.";
            case 5: return "Alhamdulillah! The final number has been selected.";
            default: return "";
        }
    };

    const renderNumbers = (numbers: number[], title: string, highlight = false) => (
        <div className={`bg-card border rounded-xl p-4 ${highlight ? 'border-2 border-primary' : ''}`}>
            <h4 className="text-lg font-bold text-primary mb-3">{title}</h4>
            <div className="flex gap-3 flex-wrap justify-center">
                {numbers.map((num, idx) => (
                    <div key={idx} className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${highlight ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                        {num}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="text-center mb-8">
                <p className="text-muted-foreground text-lg">
                    {getStageDescription()}
                </p>
            </div>

            <div className="flex gap-4 justify-center mb-8">
                {stage < 5 ? (
                    <BismillahButton onClick={startDraw}>
                        {stage === 0 ? 'First Draw' : stage === 1 ? 'Second Draw' : stage === 2 ? 'Third Draw' : stage === 3 ? 'Select 5' : 'Get Final Number'}
                    </BismillahButton>
                ) : (
                    exactNumber !== null && (
                        <div className="bg-primary rounded-3xl p-8 text-center animate-pulse">
                            <h3 className="text-2xl font-bold text-primary-foreground mb-4">
                                Alhamdulillah! Final Result
                            </h3>
                            <div className="text-8xl font-bold text-primary-foreground mb-4">
                                {exactNumber}
                            </div>
                        </div>
                    )
                )}
                {(stage > 0) && (
                    <button
                        onClick={resetProcess}
                        className="bg-secondary text-secondary-foreground px-6 py-3 rounded-xl hover:bg-accent transition-colors"
                    >
                        Restart
                    </button>
                )}
            </div>
            
            <div className="space-y-4">
                {round1Numbers.length > 0 && renderNumbers(round1Numbers, "First Stage Numbers")}
                {round2Numbers.length > 0 && renderNumbers(round2Numbers, "Second Stage Numbers")}
                {round3Numbers.length > 0 && renderNumbers(round3Numbers, "Third Stage Numbers")}
                {finalFive.length > 0 && renderNumbers(finalFive, "Final Five Numbers", true)}
            </div>
        </div>
    );
};


// --- Elimination Method Component ---
const EliminationMethod = () => {
    const [allNumbers, setAllNumbers] = useState<number[]>([]);
    const [remainingNumbers, setRemainingNumbers] = useState<number[]>([]);
    const [selectedNumbers, setSelectedNumbers] = useState<any[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [finalNumber, setFinalNumber] = useState<number | null>(null);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        const numbers = Array.from({ length: 99 }, (_, i) => i + 1);
        setAllNumbers(numbers);
        setRemainingNumbers(numbers);
    }, []);

    const performSingleDraw = () => {
        if (remainingNumbers.length <= 1) {
            setFinalNumber(remainingNumbers[0]);
            setIsComplete(true);
            return;
        }

        const randomIndex = Math.floor(Math.random() * remainingNumbers.length);
        const selectedNumber = remainingNumbers[randomIndex];

        const newRemaining = remainingNumbers.filter(num => num !== selectedNumber);

        setSelectedNumbers(prev => [...prev, {
            step: currentStep + 1,
            number: selectedNumber,
            remaining: newRemaining.length
        }]);

        setRemainingNumbers(newRemaining);
        setCurrentStep(prev => prev + 1);
    };

    const resetProcess = () => {
        const numbers = Array.from({ length: 99 }, (_, i) => i + 1);
        setRemainingNumbers(numbers);
        setSelectedNumbers([]);
        setCurrentStep(0);
        setFinalNumber(null);
        setIsComplete(false);
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="text-center mb-8">
                <p className="text-muted-foreground text-lg">
                    One number will be eliminated at a time, until only one remains.
                </p>
            </div>

            <div className="flex gap-4 justify-center mb-8">
                <button
                    onClick={performSingleDraw}
                    disabled={isComplete}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-bold disabled:opacity-50"
                >
                    {isComplete ? 'Complete' : 'Perform Draw'}
                </button>
                <button
                    onClick={resetProcess}
                    className="bg-secondary text-secondary-foreground px-6 py-3 rounded-xl hover:bg-accent transition-colors"
                >
                    Restart
                </button>
            </div>

            <div className="bg-card border rounded-2xl p-6 mb-6">
                <div className="flex justify-between items-center text-foreground mb-4">
                    <span>Step: {currentStep}</span>
                    <span>Remaining: {remainingNumbers.length}</span>
                    <span>Selected: {selectedNumbers.length}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                    <div
                        className="bg-primary h-3 rounded-full transition-all duration-500"
                        style={{ width: `${((99 - remainingNumbers.length) / 99) * 100}%` }}
                    ></div>
                </div>
            </div>

            {isComplete && finalNumber != null && (
                <div className="bg-primary rounded-3xl p-8 text-center mb-6 animate-pulse">
                    <h3 className="text-2xl font-bold text-primary-foreground mb-4">
                        Alhamdulillah! Final Result
                    </h3>
                    <div className="text-8xl font-bold text-primary-foreground mb-4">
                        {finalNumber}
                    </div>
                    <p className="text-primary-foreground/80 text-xl">
                        This is your exact number!
                    </p>
                </div>
            )}

            <div className="bg-card border rounded-2xl p-6">
                <h3 className="text-xl font-bold text-primary mb-4 text-center">
                    History of Selected Numbers
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-96 overflow-y-auto">
                    {selectedNumbers.map((item, index) => (
                        <div key={index} className="bg-secondary rounded-xl p-3 text-center">
                            <div className="text-sm text-muted-foreground">Step {item.step}</div>
                            <div className="text-2xl font-bold text-primary my-2">{item.number}</div>
                            <div className="text-xs text-foreground">Rem: {item.remaining}</div>
                        </div>
                    ))}
                </div>
            </div>

            {remainingNumbers.length > 0 && !isComplete && (
                <div className="bg-card border rounded-2xl p-6 mt-6">
                    <h3 className="text-xl font-bold text-primary mb-4 text-center">
                        Remaining Numbers ({remainingNumbers.length})
                    </h3>
                    <div className="grid grid-cols-10 gap-2 max-h-60 overflow-y-auto">
                        {remainingNumbers.map((num) => (
                            <div
                                key={num}
                                className="bg-secondary text-secondary-foreground text-sm p-2 rounded text-center hover:bg-accent transition-colors"
                            >
                                {num}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Multi-Stage Method Component ---
const MultiStageMethod = () => {
    const [currentStage, setCurrentStage] = useState(1);
    const [currentNumbers, setCurrentNumbers] = useState<number[]>([]);
    const [stageResults, setStageResults] = useState<any[]>([]);
    const [finalNumbers, setFinalNumbers] = useState<number[]>([]);
    const [exactNumber, setExactNumber] = useState<number | null>(null);
    const [isComplete, setIsComplete] = useState(false);

    const stages = [
        { id: 1, name: 'Stage 1', range: '1-99', count: 7 },
        { id: 2, name: 'Stage 2', range: 'Previous 7', count: 7 },
        { id: 3, name: 'Stage 3', range: 'Previous 7', count: 7 },
        { id: 4, name: 'Stage 4', range: 'Previous 7', count: 7 },
        { id: 5, name: 'Stage 5', range: 'Previous 7', count: 7 },
        { id: 6, name: 'Stage 6', range: 'Previous 7', count: 7 },
        { id: 7, name: 'Stage 7', range: 'Last 7', count: 1 }
    ];

    const generateInitialNumbers = async () => {
        const numbers = await generateIslamicRandom(1, 99, 7);
        setCurrentNumbers(numbers);
    };
    
    useEffect(() => {
        if (currentStage === 1 && currentNumbers.length === 0) {
            generateInitialNumbers();
        }
    }, [currentStage, currentNumbers]);


    const performStageDraw = () => {
        if (isComplete) return;

        if (currentStage >= 7) {
            calculateExactNumber();
            return;
        }

        const newSelection: number[] = [];
        const availableNumbers = [...currentNumbers];

        for (let i = 0; i < 7; i++) {
            const randomIndex = Math.floor(Math.random() * availableNumbers.length);
            newSelection.push(availableNumbers[randomIndex]);
        }
        
        const allResultsForFrequency = [...stageResults, { numbers: newSelection }];
        const stageResult = {
            stage: currentStage,
            numbers: [...newSelection],
            frequency: calculateFrequency(allResultsForFrequency)
        };

        setStageResults(prev => [...prev, stageResult]);
        setCurrentNumbers(newSelection);
        setCurrentStage(prev => prev + 1);
    };

    const calculateFrequency = (allResults: any[]) => {
        const frequency: { [key: number]: number } = {};
        allResults.forEach(result => {
            result.numbers.forEach((num: number) => {
                frequency[num] = (frequency[num] || 0) + 1;
            });
        });
        return frequency;
    };

    const calculateExactNumber = () => {
        const finalFrequency = calculateFrequency(stageResults);

        const numbers = Object.keys(finalFrequency).map(Number);
        let maxFreq = 0;
        let exactNum: number | null = null;

        numbers.forEach(num => {
            if (finalFrequency[num] > maxFreq) {
                maxFreq = finalFrequency[num];
                exactNum = num;
            }
        });

        setExactNumber(exactNum);
        setFinalNumbers(numbers.map(n => n));
        setIsComplete(true);
    };

    const resetProcess = () => {
        setCurrentStage(1);
        setCurrentNumbers([]);
        setStageResults([]);
        setFinalNumbers([]);
        setExactNumber(null);
        setIsComplete(false);
        generateInitialNumbers();
    };

    const currentStageInfo = stages.find(stage => stage.id === currentStage);

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="text-center mb-8">
                <p className="text-muted-foreground text-lg">
                    7 numbers are selected in 7 stages. The number that appears most frequently is the exact number.
                </p>
            </div>

            <div className="bg-card border rounded-2xl p-6 mb-6">
                <div className="flex justify-between mb-4">
                    {stages.map((stage) => (
                        <div key={stage.id} className="text-center flex-1">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-2 ${currentStage > stage.id ? 'bg-primary text-primary-foreground' : currentStage === stage.id ? 'bg-secondary text-secondary-foreground border-2 border-primary' : 'bg-muted text-muted-foreground'}`}>
                                {stage.id}
                            </div>
                            <div className="text-foreground text-xs md:text-sm">{stage.name}</div>
                        </div>
                    ))}
                </div>
            </div>

            {currentStageInfo && !isComplete && (
                <div className="bg-card border rounded-2xl p-6 mb-6 text-center">
                    <h3 className="text-2xl font-bold text-primary mb-2">
                        {currentStageInfo.name}
                    </h3>
                    <p className="text-foreground">
                        {currentStageInfo.count} numbers will be selected from {currentStageInfo.range}.
                    </p>
                </div>
            )}

            <div className="flex gap-4 justify-center mb-8">
                <button
                    onClick={performStageDraw}
                    disabled={isComplete}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-bold disabled:opacity-50"
                >
                    {isComplete ? 'Complete' : currentStage >= 7 ? 'See Final Result' : 'Complete Stage'}
                </button>
                <button
                    onClick={resetProcess}
                    className="bg-secondary text-secondary-foreground px-6 py-3 rounded-xl hover:bg-accent transition-colors"
                >
                    Restart
                </button>
            </div>

            {!isComplete && currentNumbers.length > 0 && (
                <div className="bg-card border rounded-2xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-primary mb-4 text-center">
                        Current Numbers
                    </h3>
                    <div className="flex justify-center gap-4 flex-wrap">
                        {currentNumbers.map((num, index) => (
                            <div key={index} className="bg-secondary text-secondary-foreground text-2xl font-bold w-16 h-16 rounded-full flex items-center justify-center">
                                {num}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isComplete && exactNumber !== null && (
                <div className="bg-primary rounded-3xl p-8 text-center mb-6 animate-pulse">
                    <h3 className="text-2xl font-bold text-primary-foreground mb-4">
                        Alhamdulillah! Final Result
                    </h3>
                    <div className="text-8xl font-bold text-primary-foreground mb-4">
                        {exactNumber}
                    </div>
                    <p className="text-primary-foreground/80 text-xl">
                        This number appeared {Math.max(...Object.values(calculateFrequency(stageResults)))} times.
                    </p>
                </div>
            )}

            {stageResults.length > 0 && (
                <div className="bg-card border rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-primary mb-4 text-center">
                        Stage History
                    </h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {stageResults.map((result, index) => (
                            <div key={index} className="bg-secondary rounded-xl p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-lg font-bold text-primary">
                                        {stages.find(s => s.id === result.stage)?.name}
                                    </h4>
                                    <span className="text-foreground">Stage {result.stage}</span>
                                </div>
                                <div className="flex gap-3 mb-3 flex-wrap">
                                    {result.numbers.map((num: number, idx: number) => (
                                        <div key={idx} className="bg-muted text-muted-foreground w-12 h-12 rounded-full flex items-center justify-center font-bold">
                                            {num}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {Object.entries(result.frequency).sort(([, a]: [string, any], [, b]: [string, any]) => b - a).slice(0, 3).map(([num, freq]) => (
                                        <span key={num} className="ml-3">
                                            {num}: {freq as number} times
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function ExactSelectionPage() {
    const { user, isUserLoading } = useUser();
    const { isAdmin, isAdminLoading } = useAdmin();
    const router = useRouter();
    const [activeMethod, setActiveMethod] = useState('elimination');

    useEffect(() => {
        if (!isUserLoading && !isAdminLoading) {
            if (!user || !isAdmin) {
                router.push('/');
            }
        }
    }, [user, isUserLoading, isAdmin, isAdminLoading, router]);

     if (isUserLoading || isAdminLoading) {
        return <div className="flex justify-center items-center min-h-screen"><div>Loading Admin...</div></div>;
    }

    if (!isAdmin) {
        return <div className="flex justify-center items-center min-h-screen"><div>Access Denied.</div></div>;
    }

    const methods = [
        {
            id: 'elimination',
            name: 'Elimination Method',
            description: 'One number is eliminated from 99 until only one remains.',
            icon: '🎯'
        },
        {
            id: 'multistage',
            name: 'Multi-Stage Selection',
            description: 'The number that appears most frequently in 7 stages is the exact number.',
            icon: '🔄'
        },
        {
            id: 'three-stage',
            name: 'Three-Stage Draw',
            description: 'Select a final number through three different draws.',
            icon: '🎲'
        }
    ];

    return (
        <div className="p-4">
            <div className="max-w-4xl mx-auto p-4 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {methods.map((method) => (
                        <div
                            key={method.id}
                            onClick={() => setActiveMethod(method.id)}
                            className={`bg-card border rounded-2xl p-6 cursor-pointer transition-all hover:bg-accent hover:border-primary ${activeMethod === method.id ? 'border-primary bg-accent' : 'border-border'}`}
                        >
                            <div className="text-4xl mb-4 text-center">{method.icon}</div>
                            <h3 className="text-xl font-bold text-foreground text-center mb-3">
                                {method.name}
                            </h3>
                            <p className="text-muted-foreground text-center text-sm">
                                {method.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-4">
                {activeMethod === 'elimination' && <EliminationMethod />}
                {activeMethod === 'multistage' && <MultiStageMethod />}
                {activeMethod === 'three-stage' && <ThreeStageDraw />}
            </div>

            <div className="max-w-4xl mx-auto p-4 mt-8">
                <div className="bg-card border rounded-2xl p-6 text-center">
                    <h3 className="text-xl text-primary mb-4">
                        Guidance from Allah
                    </h3>
                    <p className="text-foreground">
                        "O Allah, choose for me and select for me, and grant me the ability to make a decision according to Your will."
                    </p>
                </div>
            </div>
        </div>
    );
}
