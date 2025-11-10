'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/hooks/use-admin';


// --- GroupDraw Component ---
const GroupDraw = () => {
    const [groups, setGroups] = useState([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<any>(null);

    const sampleGroups = [
        { id: 1, name: 'خاندانی قرعہ', members: ['احمد', 'فاطمہ', 'علی', 'زینب'], createdBy: 'احمد', drawHistory: [] },
        { id: 2, name: 'دفتری ساتھی', members: ['محمد', 'حسن', 'حسین', 'عمر'], createdBy: 'محمد', drawHistory: [] }
    ];

    const createNewGroup = () => {
        if (!newGroupName.trim()) return;
        const newGroup = {
            id: Date.now(),
            name: newGroupName,
            members: ['آپ'],
            createdBy: 'آپ',
            drawHistory: [],
            inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase()
        };
        setGroups([...groups, newGroup]);
        setNewGroupName('');
    };

    const startGroupDraw = (group:any) => {
        const groupDrawResult = {
            id: Date.now(),
            date: new Date().toLocaleDateString('ur-PK'),
            participants: group.members,
            numbers: Array.from({ length: 5 }, () => Math.floor(Math.random() * 99) + 1),
            winner: group.members[Math.floor(Math.random() * group.members.length)]
        };
        const updatedGroups = groups.map(g => g.id === group.id ? { ...g, drawHistory: [...(g as any).drawHistory, groupDrawResult] } : g);
        setGroups(updatedGroups);
        const updatedSelectedGroup = { ...group, drawHistory: [...group.drawHistory, groupDrawResult] };
        setSelectedGroup(updatedSelectedGroup);
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-urdu text-islamic-gold mb-4">جماعتی قُرعہ</h2>
                <p className="text-white font-urdu text-lg">دوستوں اور خاندان کے ساتھ مل کر قرعہ اندازی کریں</p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-urdu text-white mb-4">نیا گروپ بنائیں</h3>
                <div className="flex gap-4">
                    <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="گروپ کا نام درج کریں" className="flex-1 bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-60 rounded-xl px-4 py-3 border border-white border-opacity-30" />
                    <button onClick={createNewGroup} className="bg-accent text-accent-foreground px-6 py-3 rounded-xl hover:bg-yellow-600 transition-colors font-urdu font-bold">بنائیں</button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...sampleGroups, ...groups].map((group: any) => (
                    <div key={group.id} className="bg-white bg-opacity-10 rounded-2xl p-6 border border-islamic-gold border-opacity-20">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-urdu text-white">{group.name}</h3>
                            <span className="bg-islamic-green text-white text-sm px-2 py-1 rounded">{group.members.length} اراکین</span>
                        </div>
                        <div className="mb-4">
                            <p className="text-islamic-cream text-sm mb-2">اراکین:</p>
                            <div className="flex flex-wrap gap-2">
                                {group.members.map((member: string, index: number) => (<span key={index} className="bg-white bg-opacity-20 text-white text-sm px-3 py-1 rounded-full">{member}</span>))}
                            </div>
                        </div>
                        {group.inviteCode && (
                            <div className="mb-4">
                                <p className="text-islamic-cream text-sm mb-2">دعوتی کوڈ:</p>
                                <div className="bg-islamic-dark text-islamic-gold text-center py-2 rounded-xl font-mono text-lg">{group.inviteCode}</div>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button onClick={() => startGroupDraw(group)} className="flex-1 bg-islamic-green text-white py-2 rounded-xl hover:bg-islamic-lightGreen transition-colors font-urdu">قرعہ کریں</button>
                            <button onClick={() => setSelectedGroup(group)} className="flex-1 bg-white bg-opacity-20 text-white py-2 rounded-xl hover:bg-opacity-30 transition-colors font-urdu">تفصیل</button>
                        </div>
                    </div>
                ))}
            </div>
            {selectedGroup && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-gradient-to-br from-islamic-dark to-islamic-green rounded-3xl p-6 max-w-2xl w-full border-2 border-islamic-gold max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-urdu text-white">{selectedGroup.name}</h3>
                            <button onClick={() => setSelectedGroup(null)} className="text-white text-2xl hover:text-islamic-gold">✕</button>
                        </div>
                        {selectedGroup.drawHistory.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-xl font-urdu text-islamic-gold mb-4">قرعہ کی تاریخ</h4>
                                <div className="space-y-4">
                                    {selectedGroup.drawHistory.map((draw: any) => (
                                        <div key={draw.id} className="bg-white bg-opacity-10 rounded-xl p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-white font-urdu">{draw.date}</span>
                                                <span className="bg-islamic-gold text-islamic-dark px-3 py-1 rounded-full text-sm">فاتح: {draw.winner}</span>
                                            </div>
                                            <div className="flex gap-2 mb-2">
                                                {draw.numbers.map((num: number, idx: number) => (<span key={idx} className="bg-islamic-green text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">{num}</span>))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="bg-white bg-opacity-10 rounded-xl p-4">
                            <h4 className="text-lg font-urdu text-islamic-gold mb-3">گروپ میں شامل ہوں</h4>
                            <p className="text-white text-sm mb-3">اپنے دوستوں کو دعوتی کوڈ دے کر گروپ میں شامل ہونے دیں</p>
                            <div className="flex gap-3">
                                <input type="text" placeholder="دعوتی کوڈ درج کریں" className="flex-1 bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-60 rounded-xl px-4 py-2 border border-white border-opacity-30" />
                                <button className="bg-accent text-accent-foreground px-4 py-2 rounded-xl hover:bg-yellow-600 transition-colors font-urdu">شامل ہوں</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Leaderboard Component ---
const Leaderboard = () => {
    const [activeTab, setActiveTab] = useState('weekly');
    const [currentChallenge, setCurrentChallenge] = useState<any>(null);

    const leaderboardData: any = {
        weekly: [
            { rank: 1, name: 'احمد', score: 1500, draws: 15, group: 'خاندانی' },
            { rank: 2, name: 'فاطمہ', score: 1450, draws: 14, group: 'دفتری' },
            { rank: 3, name: 'علی', score: 1300, draws: 13, group: 'دوست' },
            { rank: 4, name: 'زینب', score: 1250, draws: 12, group: 'خاندانی' },
            { rank: 5, name: 'محمد', score: 1200, draws: 11, group: 'دفتری' }
        ],
        monthly: [
            { rank: 1, name: 'فاطمہ', score: 5800, draws: 58, group: 'دفتری' },
            { rank: 2, name: 'احمد', score: 5600, draws: 56, group: 'خاندانی' },
            { rank: 3, name: 'عمر', score: 5400, draws: 54, group: 'دوست' }
        ],
        allTime: [
            { rank: 1, name: 'احمد', score: 25800, draws: 258, group: 'خاندانی' },
            { rank: 2, name: 'فاطمہ', score: 24500, draws: 245, group: 'دفتری' },
            { rank: 3, name: 'علی', score: 23000, draws: 230, group: 'دوست' }
        ]
    };

    const challenges = [
        { id: 1, title: 'روزانہ تسبیح چیلنج', description: 'روزانہ 100 بار تسبیح پڑھیں', reward: 100, participants: 45, endDate: '2024-01-15', type: 'تسبیح' },
        { id: 2, title: 'ہفتہ وار قرعہ چیلنج', description: 'ہفتے میں 10 بار قرعہ اندازی کریں', reward: 200, participants: 32, endDate: '2024-01-20', type: 'قرعہ' },
        { id: 3, title: 'گروپ فعالیت چیلنج', description: 'اپنے گروپ میں 5 قرعے مکمل کریں', reward: 150, participants: 28, endDate: '2024-01-18', type: 'گروپ' }
    ];

    const joinChallenge = (challengeId: number) => {
        setCurrentChallenge(challenges.find(c => c.id === challengeId));
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-urdu text-islamic-gold mb-4">تَصْنِيفُ الْمُبَارَكَة</h2>
                <p className="text-white font-urdu text-lg">نیکی کے مقابلوں میں حصہ لیں اور انعامات جیتیں</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white bg-opacity-10 rounded-3xl p-6 border border-islamic-gold border-opacity-30">
                    <h3 className="text-2xl font-urdu text-islamic-gold text-center mb-6">🏆 لیڈر بورڈ</h3>
                    <div className="flex gap-2 mb-6 bg-white bg-opacity-10 rounded-2xl p-1">
                        {['weekly', 'monthly', 'allTime'].map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-xl transition-all font-urdu ${activeTab === tab ? 'bg-accent text-accent-foreground' : 'text-white hover:bg-white hover:bg-opacity-10'}`}>
                                {tab === 'weekly' && 'ہفتہ وار'}
                                {tab === 'monthly' && 'ماہانہ'}
                                {tab === 'allTime' && 'ہمہ وقت'}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-3">
                        {leaderboardData[activeTab].map((user: any) => (
                            <div key={user.rank} className="flex items-center justify-between bg-white bg-opacity-5 rounded-2xl p-4 hover:bg-opacity-10 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user.rank === 1 ? 'bg-yellow-500' : user.rank === 2 ? 'bg-gray-400' : user.rank === 3 ? 'bg-orange-500' : 'bg-islamic-green'}`}>{user.rank}</div>
                                    <div>
                                        <div className="text-white font-urdu text-lg">{user.name}</div>
                                        <div className="text-islamic-cream text-sm">{user.group} گروپ</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-islamic-gold text-xl font-bold">{user.score}</div>
                                    <div className="text-white text-sm">{user.draws} قرعے</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-3xl p-6 border border-islamic-gold border-opacity-30">
                    <h3 className="text-2xl font-urdu text-islamic-gold text-center mb-6">🎯 موجودہ چیلنجز</h3>
                    <div className="space-y-4">
                        {challenges.map((challenge) => (
                            <div key={challenge.id} className="bg-white bg-opacity-5 rounded-2xl p-4 hover:bg-opacity-10 transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="text-white font-urdu text-lg mb-1">{challenge.title}</h4>
                                        <p className="text-islamic-cream text-sm">{challenge.description}</p>
                                    </div>
                                    <span className="bg-islamic-green text-white text-sm px-2 py-1 rounded">{challenge.type}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-white mb-3">
                                    <span>انعام: {challenge.reward} پوائنٹس</span>
                                    <span>{challenge.participants} شرکاء</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => joinChallenge(challenge.id)} className="flex-1 bg-accent text-accent-foreground py-2 rounded-xl hover:bg-yellow-600 transition-colors font-urdu font-bold">شامل ہوں</button>
                                    <button className="bg-white bg-opacity-20 text-white py-2 px-4 rounded-xl hover:bg-opacity-30 transition-colors font-urdu">تفصیل</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-3xl p-6 border border-islamic-gold border-opacity-30 mt-8">
                <h3 className="text-2xl font-urdu text-islamic-gold text-center mb-6">📊 میری کارکردگی</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-white bg-opacity-5 rounded-2xl p-4">
                        <div className="text-3xl text-islamic-gold mb-2">🎯</div>
                        <div className="text-white font-urdu">کل قرعے</div>
                        <div className="text-islamic-gold text-2xl font-bold">47</div>
                    </div>
                    <div className="bg-white bg-opacity-5 rounded-2xl p-4">
                        <div className="text-3xl text-islamic-gold mb-2">🤲</div>
                        <div className="text-white font-urdu">تسبیح count</div>
                        <div className="text-islamic-gold text-2xl font-bold">1,234</div>
                    </div>
                    <div className="bg-white bg-opacity-5 rounded-2xl p-4">
                        <div className="text-3xl text-islamic-gold mb-2">🏆</div>
                        <div className="text-white font-urdu">موجودہ درجہ</div>
                        <div className="text-islamic-gold text-2xl font-bold">6</div>
                    </div>
                    <div className="bg-white bg-opacity-5 rounded-2xl p-4">
                        <div className="text-3xl text-islamic-gold mb-2">⭐</div>
                        <div className="text-white font-urdu">کل اسکور</div>
                        <div className="text-islamic-gold text-2xl font-bold">1,150</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ShareResults Component ---
const ShareResults = ({ numbers, settings }: { numbers?: number[], settings?: any }) => {
    const [sharedResults, setSharedResults] = useState<any[]>([]);
    const [comment, setComment] = useState('');

    const sampleSharedResults = [
        { id: 1, userName: 'احمد', numbers: [12, 45, 78, 23, 89], comment: 'آج کا قرعہ! اللہ کا شکر ہے۔', likes: 5, timestamp: '2 گھنٹے پہلے', userAvatar: '🦋' },
        { id: 2, userName: 'فاطمہ', numbers: [34, 67, 12, 89, 56], comment: 'خاندان کے ساتھ قرعہ اندازی', likes: 3, timestamp: '1 دن پہلے', userAvatar: '🌸' }
    ];

    const shareMyResult = () => {
        if (!numbers || numbers.length === 0) return;
        const newShare = { id: Date.now(), userName: 'آپ', numbers: numbers, comment: comment || 'اللہ کا شکر ہے!', likes: 0, timestamp: 'ابھی', userAvatar: '⭐' };
        setSharedResults([newShare, ...sharedResults]);
        setComment('');
    };

    const likeResult = (resultId: number) => {
        setSharedResults(sharedResults.map(result => result.id === resultId ? { ...result, likes: result.likes + 1 } : result));
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-urdu text-islamic-gold mb-4">مُشَارَكَةُ النَّتَائِج</h2>
                <p className="text-white font-urdu text-lg">اپنے نتائج شیئر کریں اور دوسروں کے نتائج دیکھیں</p>
            </div>
            {numbers && numbers.length > 0 && (
                <div className="bg-white bg-opacity-10 rounded-2xl p-6 mb-8">
                    <h3 className="text-xl font-urdu text-white mb-4">اپنا نتیجہ شیئر کریں</h3>
                    <div className="flex gap-4 mb-4">
                        <div className="flex gap-2">
                            {numbers.map((num, index) => (<div key={index} className="bg-islamic-gold text-islamic-dark w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">{num}</div>))}
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="اپنا تبصرہ شامل کریں..." className="flex-1 bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-60 rounded-xl px-4 py-3 border border-white border-opacity-30" />
                        <button onClick={shareMyResult} className="bg-accent text-accent-foreground px-6 py-3 rounded-xl hover:bg-yellow-600 transition-colors font-urdu font-bold">شیئر کریں</button>
                    </div>
                </div>
            )}
            <div className="space-y-6">
                <h3 className="text-2xl font-urdu text-islamic-gold text-center">کمیونٹی کے نتائج</h3>
                {[...sampleSharedResults, ...sharedResults].map((result) => (
                    <div key={result.id} className="bg-white bg-opacity-10 rounded-2xl p-6 hover:bg-opacity-15 transition-all">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="text-3xl">{result.userAvatar}</div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-white font-urdu text-lg">{result.userName}</div>
                                    <div className="text-islamic-cream text-sm">{result.timestamp}</div>
                                </div>
                                <p className="text-islamic-cream">{result.comment}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 mb-4">
                            {result.numbers.map((num: number, index: number) => (<div key={index} className="bg-islamic-green text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">{num}</div>))}
                        </div>
                        <div className="flex justify-between items-center">
                            <button onClick={() => likeResult(result.id)} className="flex items-center gap-2 text-white hover:text-islamic-gold transition-colors">
                                <span>🤲</span>
                                <span>دعا ({result.likes})</span>
                            </button>
                            <div className="flex gap-3">
                                <button className="text-white hover:text-islamic-gold transition-colors">🔄</button>
                                <button className="text-white hover:text-islamic-gold transition-colors">💬</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {sampleSharedResults.length === 0 && sharedResults.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📤</div>
                    <h3 className="text-2xl font-urdu text-white mb-2">ابھی تک کوئی شیئر نہیں</h3>
                    <p className="text-islamic-cream">پہلے بنیں جو اپنا نتیجہ شیئر کرتے ہیں!</p>
                </div>
            )}
        </div>
    );
};


export default function CommunityPage() {
    const { user, isUserLoading } = useUser();
    const { isAdmin, isAdminLoading } = useAdmin();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('groups');

    useEffect(() => {
        if (!isUserLoading && !isAdminLoading) {
        if (!user || !isAdmin) {
            router.push('/');
        }
        }
    }, [user, isUserLoading, isAdmin, isAdminLoading, router]);

    if (isUserLoading || isAdminLoading) {
        return <div className="flex justify-center items-center min-h-screen"><div className="text-white">Loading Admin...</div></div>;
    }

    if (!isAdmin) {
        return <div className="flex justify-center items-center min-h-screen"><div className="text-white">Access Denied.</div></div>;
    }

    const tabs = [
        { id: 'groups', name: 'گروپس', icon: '👥' },
        { id: 'leaderboard', name: 'لیڈر بورڈ', icon: '🏆' },
        { id: 'share', name: 'شیئر کریں', icon: '📤' }
    ];

    return (
        <div className="p-4">
            <div className="flex justify-center mb-8 px-4">
                <div className="bg-white bg-opacity-10 rounded-2xl p-1 flex gap-1 flex-wrap justify-center">
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl transition-all font-urdu ${activeTab === tab.id ? 'bg-accent text-accent-foreground' : 'text-white hover:bg-white hover:bg-opacity-10'}`}>
                            <span>{tab.icon}</span>
                            <span>{tab.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="container mx-auto px-4">
                {activeTab === 'groups' && <GroupDraw />}
                {activeTab === 'leaderboard' && <Leaderboard />}
                {activeTab === 'share' && <ShareResults />}
            </div>
        </div>
    );
}
