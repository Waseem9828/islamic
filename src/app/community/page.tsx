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
        { id: 1, name: 'Family Draw', members: ['Ahmed', 'Fatima', 'Ali', 'Zainab'], createdBy: 'Ahmed', drawHistory: [] },
        { id: 2, name: 'Office Colleagues', members: ['Mohammed', 'Hassan', 'Hussain', 'Omar'], createdBy: 'Mohammed', drawHistory: [] }
    ];

    const createNewGroup = () => {
        if (!newGroupName.trim()) return;
        const newGroup = {
            id: Date.now(),
            name: newGroupName,
            members: ['You'],
            createdBy: 'You',
            drawHistory: [],
            inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase()
        };
        setGroups([...groups, newGroup]);
        setNewGroupName('');
    };

    const startGroupDraw = (group:any) => {
        const groupDrawResult = {
            id: Date.now(),
            date: new Date().toLocaleDateString('en-US'),
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
                <h2 className="text-3xl font-bold text-islamic-gold mb-4">Group Draw</h2>
                <p className="text-white text-lg">Draw with friends and family</p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-2xl p-6 mb-8">
                <h3 className="text-xl font-bold text-white mb-4">Create New Group</h3>
                <div className="flex gap-4">
                    <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Enter group name" className="flex-1 bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-60 rounded-xl px-4 py-3 border border-white border-opacity-30" />
                    <button onClick={createNewGroup} className="bg-accent text-accent-foreground px-6 py-3 rounded-xl hover:bg-yellow-600 transition-colors font-bold">Create</button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...sampleGroups, ...groups].map((group: any) => (
                    <div key={group.id} className="bg-white bg-opacity-10 rounded-2xl p-6 border border-islamic-gold border-opacity-20">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-white">{group.name}</h3>
                            <span className="bg-islamic-green text-white text-sm px-2 py-1 rounded">{group.members.length} members</span>
                        </div>
                        <div className="mb-4">
                            <p className="text-islamic-cream text-sm mb-2">Members:</p>
                            <div className="flex flex-wrap gap-2">
                                {group.members.map((member: string, index: number) => (<span key={index} className="bg-white bg-opacity-20 text-white text-sm px-3 py-1 rounded-full">{member}</span>))}
                            </div>
                        </div>
                        {group.inviteCode && (
                            <div className="mb-4">
                                <p className="text-islamic-cream text-sm mb-2">Invite Code:</p>
                                <div className="bg-islamic-dark text-islamic-gold text-center py-2 rounded-xl font-mono text-lg">{group.inviteCode}</div>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button onClick={() => startGroupDraw(group)} className="flex-1 bg-islamic-green text-white py-2 rounded-xl hover:bg-islamic-lightGreen transition-colors">Start Draw</button>
                            <button onClick={() => setSelectedGroup(group)} className="flex-1 bg-white bg-opacity-20 text-white py-2 rounded-xl hover:bg-opacity-30 transition-colors">Details</button>
                        </div>
                    </div>
                ))}
            </div>
            {selectedGroup && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-gradient-to-br from-islamic-dark to-islamic-green rounded-3xl p-6 max-w-2xl w-full border-2 border-islamic-gold max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white">{selectedGroup.name}</h3>
                            <button onClick={() => setSelectedGroup(null)} className="text-white text-2xl hover:text-islamic-gold">✕</button>
                        </div>
                        {selectedGroup.drawHistory.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-xl font-bold text-islamic-gold mb-4">Draw History</h4>
                                <div className="space-y-4">
                                    {selectedGroup.drawHistory.map((draw: any) => (
                                        <div key={draw.id} className="bg-white bg-opacity-10 rounded-xl p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-white">{draw.date}</span>
                                                <span className="bg-islamic-gold text-islamic-dark px-3 py-1 rounded-full text-sm">Winner: {draw.winner}</span>
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
                            <h4 className="text-lg font-bold text-islamic-gold mb-3">Join Group</h4>
                            <p className="text-white text-sm mb-3">Let your friends join the group by giving them the invite code</p>
                            <div className="flex gap-3">
                                <input type="text" placeholder="Enter invite code" className="flex-1 bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-60 rounded-xl px-4 py-2 border border-white border-opacity-30" />
                                <button className="bg-accent text-accent-foreground px-4 py-2 rounded-xl hover:bg-yellow-600 transition-colors">Join</button>
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
            { rank: 1, name: 'Ahmed', score: 1500, draws: 15, group: 'Family' },
            { rank: 2, name: 'Fatima', score: 1450, draws: 14, group: 'Office' },
            { rank: 3, name: 'Ali', score: 1300, draws: 13, group: 'Friends' },
            { rank: 4, name: 'Zainab', score: 1250, draws: 12, group: 'Family' },
            { rank: 5, name: 'Mohammed', score: 1200, draws: 11, group: 'Office' }
        ],
        monthly: [
            { rank: 1, name: 'Fatima', score: 5800, draws: 58, group: 'Office' },
            { rank: 2, name: 'Ahmed', score: 5600, draws: 56, group: 'Family' },
            { rank: 3, name: 'Omar', score: 5400, draws: 54, group: 'Friends' }
        ],
        allTime: [
            { rank: 1, name: 'Ahmed', score: 25800, draws: 258, group: 'Family' },
            { rank: 2, name: 'Fatima', score: 24500, draws: 245, group: 'Office' },
            { rank: 3, name: 'Ali', score: 23000, draws: 230, group: 'Friends' }
        ]
    };

    const challenges = [
        { id: 1, title: 'Daily Tasbih Challenge', description: 'Recite Tasbih 100 times daily', reward: 100, participants: 45, endDate: '2024-01-15', type: 'Tasbih' },
        { id: 2, title: 'Weekly Draw Challenge', description: 'Perform 10 draws in a week', reward: 200, participants: 32, endDate: '2024-01-20', type: 'Draw' },
        { id: 3, title: 'Group Activity Challenge', description: 'Complete 5 draws in your group', reward: 150, participants: 28, endDate: '2024-01-18', type: 'Group' }
    ];

    const joinChallenge = (challengeId: number) => {
        setCurrentChallenge(challenges.find(c => c.id === challengeId));
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-islamic-gold mb-4">Blessed Leaderboard</h2>
                <p className="text-white text-lg">Participate in virtuous competitions and win rewards</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white bg-opacity-10 rounded-3xl p-6 border border-islamic-gold border-opacity-30">
                    <h3 className="text-2xl font-bold text-islamic-gold text-center mb-6">🏆 Leaderboard</h3>
                    <div className="flex gap-2 mb-6 bg-white bg-opacity-10 rounded-2xl p-1">
                        {['weekly', 'monthly', 'allTime'].map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-xl transition-all ${activeTab === tab ? 'bg-accent text-accent-foreground' : 'text-white hover:bg-white hover:bg-opacity-10'}`}>
                                {tab === 'weekly' && 'Weekly'}
                                {tab === 'monthly' && 'Monthly'}
                                {tab === 'allTime' && 'All Time'}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-3">
                        {leaderboardData[activeTab].map((user: any) => (
                            <div key={user.rank} className="flex items-center justify-between bg-white bg-opacity-5 rounded-2xl p-4 hover:bg-opacity-10 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user.rank === 1 ? 'bg-yellow-500' : user.rank === 2 ? 'bg-gray-400' : user.rank === 3 ? 'bg-orange-500' : 'bg-islamic-green'}`}>{user.rank}</div>
                                    <div>
                                        <div className="text-white text-lg">{user.name}</div>
                                        <div className="text-islamic-cream text-sm">{user.group} Group</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-islamic-gold text-xl font-bold">{user.score}</div>
                                    <div className="text-white text-sm">{user.draws} draws</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-3xl p-6 border border-islamic-gold border-opacity-30">
                    <h3 className="text-2xl font-bold text-islamic-gold text-center mb-6">🎯 Current Challenges</h3>
                    <div className="space-y-4">
                        {challenges.map((challenge) => (
                            <div key={challenge.id} className="bg-white bg-opacity-5 rounded-2xl p-4 hover:bg-opacity-10 transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="text-white font-bold text-lg mb-1">{challenge.title}</h4>
                                        <p className="text-islamic-cream text-sm">{challenge.description}</p>
                                    </div>
                                    <span className="bg-islamic-green text-white text-sm px-2 py-1 rounded">{challenge.type}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-white mb-3">
                                    <span>Reward: {challenge.reward} points</span>
                                    <span>{challenge.participants} participants</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => joinChallenge(challenge.id)} className="flex-1 bg-accent text-accent-foreground py-2 rounded-xl hover:bg-yellow-600 transition-colors font-bold">Join</button>
                                    <button className="bg-white bg-opacity-20 text-white py-2 px-4 rounded-xl hover:bg-opacity-30 transition-colors">Details</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-3xl p-6 border border-islamic-gold border-opacity-30 mt-8">
                <h3 className="text-2xl font-bold text-islamic-gold text-center mb-6">📊 My Performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-white bg-opacity-5 rounded-2xl p-4">
                        <div className="text-3xl text-islamic-gold mb-2">🎯</div>
                        <div className="text-white">Total Draws</div>
                        <div className="text-islamic-gold text-2xl font-bold">47</div>
                    </div>
                    <div className="bg-white bg-opacity-5 rounded-2xl p-4">
                        <div className="text-3xl text-islamic-gold mb-2">🤲</div>
                        <div className="text-white">Tasbih Count</div>
                        <div className="text-islamic-gold text-2xl font-bold">1,234</div>
                    </div>
                    <div className="bg-white bg-opacity-5 rounded-2xl p-4">
                        <div className="text-3xl text-islamic-gold mb-2">🏆</div>
                        <div className="text-white">Current Rank</div>
                        <div className="text-islamic-gold text-2xl font-bold">6</div>
                    </div>
                    <div className="bg-white bg-opacity-5 rounded-2xl p-4">
                        <div className="text-3xl text-islamic-gold mb-2">⭐</div>
                        <div className="text-white">Total Score</div>
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
        { id: 1, userName: 'Ahmed', numbers: [12, 45, 78, 23, 89], comment: 'Today\'s draw! Thank God.', likes: 5, timestamp: '2 hours ago', userAvatar: '🦋' },
        { id: 2, userName: 'Fatima', numbers: [34, 67, 12, 89, 56], comment: 'Draw with the family', likes: 3, timestamp: '1 day ago', userAvatar: '🌸' }
    ];

    const shareMyResult = () => {
        if (!numbers || numbers.length === 0) return;
        const newShare = { id: Date.now(), userName: 'You', numbers: numbers, comment: comment || 'Thank God!', likes: 0, timestamp: 'now', userAvatar: '⭐' };
        setSharedResults([newShare, ...sharedResults]);
        setComment('');
    };

    const likeResult = (resultId: number) => {
        setSharedResults(sharedResults.map(result => result.id === resultId ? { ...result, likes: result.likes + 1 } : result));
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-islamic-gold mb-4">Share Results</h2>
                <p className="text-white text-lg">Share your results and see others' results</p>
            </div>
            {numbers && numbers.length > 0 && (
                <div className="bg-white bg-opacity-10 rounded-2xl p-6 mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">Share Your Result</h3>
                    <div className="flex gap-4 mb-4">
                        <div className="flex gap-2">
                            {numbers.map((num, index) => (<div key={index} className="bg-islamic-gold text-islamic-dark w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">{num}</div>))}
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add your comment..." className="flex-1 bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-60 rounded-xl px-4 py-3 border border-white border-opacity-30" />
                        <button onClick={shareMyResult} className="bg-accent text-accent-foreground px-6 py-3 rounded-xl hover:bg-yellow-600 transition-colors font-bold">Share</button>
                    </div>
                </div>
            )}
            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-islamic-gold text-center">Community Results</h3>
                {[...sampleSharedResults, ...sharedResults].map((result) => (
                    <div key={result.id} className="bg-white bg-opacity-10 rounded-2xl p-6 hover:bg-opacity-15 transition-all">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="text-3xl">{result.userAvatar}</div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-white font-bold text-lg">{result.userName}</div>
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
                                <span>Pray ({result.likes})</span>
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
                    <h3 className="text-2xl font-bold text-white mb-2">No Shares Yet</h3>
                    <p className="text-islamic-cream">Be the first to share your result!</p>
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
        { id: 'groups', name: 'Groups', icon: '👥' },
        { id: 'leaderboard', name: 'Leaderboard', icon: '🏆' },
        { id: 'share', name: 'Share', icon: '📤' }
    ];

    return (
        <div className="p-4">
            <div className="flex justify-center mb-8 px-4">
                <div className="bg-white bg-opacity-10 rounded-2xl p-1 flex gap-1 flex-wrap justify-center">
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-accent text-accent-foreground' : 'text-white hover:bg-white hover:bg-opacity-10'}`}>
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
