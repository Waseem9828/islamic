
'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useCollection, useFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Wallet, History, Badge as BadgeIcon, Calendar, Mail, Phone, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Type definitions
interface UserProfile {
    id: string;
    displayName?: string;
    email?: string;
    photoURL?: string;
    createdAt?: { toDate: () => Date };
    status?: 'active' | 'suspended';
    isAdmin?: boolean;
    phoneNumber?: string;
}

interface UserWallet {
    depositBalance: number;
    winningBalance: number;
    bonusBalance: number;
}

interface UserTransaction {
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    reason: string;
    status: string;
    timestamp: { toDate: () => Date };
}

// Sub-components
const ProfileHeader = ({ user }: { user: UserProfile }) => (
    <Card>
        <CardContent className="p-6 flex items-start gap-6">
            <Avatar className="h-24 w-24 border-4">
                <AvatarImage src={user.photoURL} alt={user.displayName} />
                <AvatarFallback>{user.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1.5">
                <CardTitle className="text-2xl">{user.displayName}</CardTitle>
                <p className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded w-fit">{user.id}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="capitalize">{user.status}</Badge>
                    {user.isAdmin && <Badge variant="secondary">Admin</Badge>}
                </div>
            </div>
             <Button variant="outline" size="icon" className="ml-auto"><Edit className="h-4 w-4" /></Button>
        </CardContent>
    </Card>
);

const WalletCard = ({ wallet }: { wallet: UserWallet | null }) => (
     <Card>
        <CardHeader>
            <CardTitle className="flex items-center text-lg"><Wallet className="mr-2 h-5 w-5"/> Wallet Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Deposit</p>
                <p className="text-xl font-bold">₹{wallet?.depositBalance?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Winnings</p>
                <p className="text-xl font-bold">₹{wallet?.winningBalance?.toLocaleString() || 0}</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Bonus</p>
                <p className="text-xl font-bold">₹{wallet?.bonusBalance?.toLocaleString() || 0}</p>
            </div>
        </CardContent>
    </Card>
)

const InfoCard = ({ user }: { user: UserProfile }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center text-lg"><User className="mr-2 h-5 w-5"/> User Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
             <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/><span>{user.email}</span></div>
             <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/><span>{user.phoneNumber || 'Not provided'}</span></div>
             <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground"/><span>Joined on {user.createdAt ? format(user.createdAt.toDate(), 'PPP') : 'N/A'}</span></div>
        </CardContent>
    </Card>
)

const TransactionsTable = ({ transactions, isLoading }: { transactions: UserTransaction[] | null, isLoading: boolean }) => (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center text-lg"><History className="mr-2 h-5 w-5"/> Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full" /> : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions && transactions.length > 0 ? transactions.map(tx => (
                        <TableRow key={tx.id}>
                            <TableCell className="text-xs">{format(tx.timestamp.toDate(), 'PPp')}</TableCell>
                            <TableCell className="capitalize">{tx.type}</TableCell>
                            <TableCell className="capitalize">{tx.reason.replace(/_/g, ' ')}</TableCell>
                            <TableCell><Badge variant="outline" className="capitalize">{tx.status}</Badge></TableCell>
                            <TableCell className={`text-right font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">No transactions found.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            )}
        </CardContent>
    </Card>
)

// Main Page Component
export default function UserDetailsPage() {
    const { userId } = useParams();
    const router = useRouter();
    const { firestore } = useFirebase();

    const userRef = useMemo(() => {
        if (!firestore || !userId) return null;
        return doc(firestore, 'users', userId as string);
    }, [firestore, userId]);
    const { data: user, isLoading: isLoadingUser } = useDoc<UserProfile>(userRef);
    
    const walletRef = useMemo(() => {
        if (!firestore || !userId) return null;
        return doc(firestore, 'wallets', userId as string);
    }, [firestore, userId]);
    const { data: wallet, isLoading: isLoadingWallet } = useDoc<UserWallet>(walletRef);

    const transactionsQuery = useMemo(() => {
        if (!firestore || !userId) return null;
        return query(collection(firestore, 'transactions'), where('userId', '==', userId), orderBy('timestamp', 'desc'));
    }, [firestore, userId]);
    const { data: transactions, isLoading: isLoadingTransactions } = useCollection<UserTransaction>(transactionsQuery);

    if (isLoadingUser) {
        return <div className="space-y-4"> <Skeleton className="h-10 w-32" /> <Skeleton className="h-32 w-full" /> <Skeleton className="h-48 w-full" /> </div>
    }

    if (!user) {
        return <div>User not found. <Button onClick={() => router.back()}>Go Back</Button></div>;
    }

    return (
        <div className="space-y-6">
             <Button onClick={() => router.back()} variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4"/> Back to Users
            </Button>
            <ProfileHeader user={user}/>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InfoCard user={user}/>
                <WalletCard wallet={wallet} />
            </div>
            <TransactionsTable transactions={transactions} isLoading={isLoadingTransactions} />
        </div>
    );
}
