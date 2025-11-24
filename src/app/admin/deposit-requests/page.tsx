'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc, DocumentData } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase/provider'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Copy, Banknote, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Define the structure for a wallet
interface Wallet {
  depositBalance?: number;
  winningBalance?: number;
  bonusBalance?: number;
}

// Define the structure for a user
interface User {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  wallet?: Wallet;
}

// Define the structure for a deposit request
interface Request {
  id: string;
  amount: number;
  transactionId: string;
  userId: string;
  requestedAt: { toDate: () => Date };
  screenshotUrl?: string; // Corrected from screenshotURL to screenshotUrl
}

// Combine Request with User information
type RequestWithUser = Request & { user?: User };

const RequestCard = ({ request, onProcess, isSubmitting }: { request: RequestWithUser; onProcess: (id: string, approve: boolean) => void; isSubmitting: boolean }) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const updateDate = () => {
      if (request.requestedAt) {
        setTimeAgo(formatDistanceToNow(request.requestedAt.toDate(), { addSuffix: true }));
      }
    }
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, [request.requestedAt]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.info('Copied to clipboard');
  }

  const userDisplayName = request.user?.displayName || request.user?.email || 'Unknown User';
  const userIdentifier = request.user?.email || request.userId;
  const totalBalance = (request.user?.wallet?.depositBalance ?? 0) + (request.user?.wallet?.winningBalance ?? 0) + (request.user?.wallet?.bonusBalance ?? 0);

  return (
    <Card className="p-4 transition-all hover:shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
            <div className="md:col-span-2 flex items-start gap-4">
                <Avatar className="h-12 w-12 border-2 border-transparent group-hover:border-primary transition-colors">
                    <AvatarImage src={request.user?.photoURL || `https://avatar.vercel.sh/${userIdentifier}.png`} alt={userDisplayName} />
                    <AvatarFallback>{userDisplayName[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                     <p className="font-bold text-2xl text-primary">₹{request.amount.toLocaleString()}</p>
                     <p className='font-semibold'>{userDisplayName}</p>
                     <div className='text-xs text-muted-foreground flex items-center gap-2 flex-wrap'>
                        <p className="flex items-center gap-1 font-mono">
                            {request.transactionId}
                            <button onClick={() => copyToClipboard(request.transactionId)} className="hover:text-primary"><Copy className="h-3 w-3"/></button>
                        </p>
                     </div>
                     <p className="text-xs text-muted-foreground">{timeAgo}</p>
                </div>
            </div>
            <div className="flex gap-2 justify-self-start md:justify-self-end">
                <Button variant="outline" size="sm" onClick={() => onProcess(request.id, false)} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4 text-red-500"/>} Reject
                </Button>
                <Button size="sm" onClick={() => onProcess(request.id, true)} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>} Approve
                </Button>
            </div>
        </div>
        {request.screenshotUrl && (
            <div className='mt-4'>
                <Button variant="outline" size="sm" asChild>
                    <a href={request.screenshotUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Screenshot
                    </a>
                </Button>
            </div>
        )}
        {request.user?.wallet && (
          <div className="mt-4 pt-4 border-t space-y-2 text-sm text-muted-foreground">
              <h4 className="text-sm font-semibold text-primary mb-2">User Wallet</h4>
              <div className="flex justify-between items-center">
                  <span>Current Total Balance:</span>
                  <span className="font-mono text-base text-primary">₹{totalBalance.toLocaleString() ?? 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                  <span>Deposit Balance:</span>
                  <span className="font-mono">₹{request.user.wallet.depositBalance?.toLocaleString() ?? 'N/A'}</span>
              </div>
               <div className="flex justify-between items-center">
                  <span>Winning Balance:</span>
                  <span className="font-mono">₹{request.user.wallet.winningBalance?.toLocaleString() ?? 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                  <span>Bonus Balance:</span>
                  <span className="font-mono">₹{request.user.wallet.bonusBalance?.toLocaleString() ?? 'N/A'}</span>
              </div>
          </div>
        )}
    </Card>
  );
};

export default function ManageDepositsPage() {
  const { firestore, functions } = useFirebase(); 
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [requests, setRequests] = useState<RequestWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const requestsQuery = query(
      collection(firestore, 'depositRequests'), 
      where('status', '==', 'pending'), 
      orderBy('requestedAt', 'desc')
    );

    const unsubscribe = onSnapshot(requestsQuery, 
      async (snapshot) => {
        const newRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Request));
        
        const requestsWithUsers = await Promise.all(newRequests.map(async (request) => {
            try {
                const userDoc = await getDoc(doc(firestore, 'users', request.userId));
                let user: User | undefined;
                if (userDoc.exists()) {
                    user = { id: userDoc.id, ...userDoc.data() } as User;
                    const walletDoc = await getDoc(doc(firestore, 'wallets', request.userId));
                    if (walletDoc.exists()) {
                        user.wallet = walletDoc.data() as Wallet;
                    }
                }
                return { ...request, user };
            } catch (error) {
                console.error(`Failed to fetch user or wallet for ${request.userId}`, error);
            }
            return { ...request, user: undefined };
        }));

        setRequests(requestsWithUsers);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching deposit requests:", error);
        toast.error("Failed to load requests", { description: error.message });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore]);


  const processDepositFunction = useMemo(() => {
      if (!functions) return null;
      return httpsCallable(functions, 'processDeposit');
  }, [functions]);

  const handleProcessRequest = async (requestId: string, approve: boolean) => {
    if (!processDepositFunction) { 
      toast.error('Functions service is not available.'); 
      return; 
    }
    setIsSubmitting(prev => ({ ...prev, [requestId]: true }));
    
    try {
      const result = await processDepositFunction({ requestId, approve });
      const data = (result.data as any);
      toast.success(`Request ${approve ? 'Approved' : 'Rejected'}`, { 
        description: data?.message as string,
      });
    } catch (err: any) {
      console.error('Error processing request:', err);
      toast.error('Operation Failed', { description: err.message || 'An unknown error occurred.' });
    } finally {
      setIsSubmitting(prev => ({ ...prev, [requestId]: false }));
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Banknote className="mr-2"/>Deposit Requests</CardTitle>
          <CardDescription>Review and process pending deposit requests. Approving a request will add the funds and bonus to the user's wallet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-36 w-full" />
            </div>
          )}
          {!loading && requests.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold">All Caught Up!</h3>
                <p className="text-muted-foreground mt-1">There are no pending deposit requests.</p>
            </div>
          )}
          {!loading && requests.map(request => (
              <RequestCard
                key={request.id}
                request={request}
                onProcess={handleProcessRequest}
                isSubmitting={isSubmitting[request.id]}
              />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
