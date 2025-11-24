
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, ListChecks, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Define the structure for a user
interface User {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

// Define the structure for a withdrawal request
interface WithdrawalRequest {
    id: string;
    amount: number;
    upiId: string;
    userId: string;
    requestedAt: { toDate: () => Date };
}

// Combine WithdrawalRequest with User information
type RequestWithUser = WithdrawalRequest & { user?: User };

const RequestCard = ({ request, onProcess, isSubmitting }: { request: RequestWithUser, onProcess: (id: string, approve: boolean) => void, isSubmitting: boolean }) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (request.requestedAt) {
      const updateDate = () => {
        setTimeAgo(formatDistanceToNow(request.requestedAt.toDate(), { addSuffix: true }));
      }
      updateDate();
      const interval = setInterval(updateDate, 60000);
      return () => clearInterval(interval);
    }
  }, [request.requestedAt, setTimeAgo]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.info('Copied to clipboard');
  }
  
  const userDisplayName = request.user?.displayName || request.user?.email || 'Unknown User';
  const userIdentifier = request.user?.email || request.userId;

  return (
    <Card className="p-4 grid grid-cols-1 md:grid-cols-3 items-center gap-4 transition-all hover:shadow-md">
        <div className="md:col-span-2 flex items-start gap-4">
             <Avatar className="h-12 w-12 border-2 border-transparent group-hover:border-primary transition-colors">
                <AvatarImage src={request.user?.photoURL || `https://avatar.vercel.sh/${userIdentifier}.png`} alt={userDisplayName} />
                <AvatarFallback>{userDisplayName[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
                 <p className="font-bold text-2xl text-primary">₹{request.amount.toLocaleString()}</p>
                 <p className='font-semibold'>{userDisplayName}</p>
                 <div className='text-xs text-muted-foreground flex items-center gap-2 flex-wrap'>
                    <p className="flex items-center gap-1 font-mono">
                       To: {request.upiId}
                        <button onClick={() => copyToClipboard(request.upiId)} className="hover:text-primary"><Copy className="h-3 w-3"/></button>
                    </p>
                 </div>
                 <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
        </div>
        <div className="flex gap-2 justify-self-start md:justify-self-end">
            <Button 
                variant="outline"
                size="sm"
                onClick={() => onProcess(request.id, false)}
                disabled={isSubmitting}
            >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4 text-red-500"/>}
                Reject
            </Button>
            <Button 
                size="sm"
                onClick={() => onProcess(request.id, true)}
                disabled={isSubmitting}    
                 className="bg-green-600 hover:bg-green-700"
            >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                Approve
            </Button>
        </div>
    </Card>
  );
};


export default function ManageWithdrawalsPage() {
  const { firestore, functions } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [requests, setRequests] = useState<RequestWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  const processWithdrawalFunction = useMemo(() => {
    if (!functions) return null;
    return httpsCallable(functions, 'processWithdrawal');
  }, [functions]);

  useEffect(() => {
    if (!firestore) {
        setLoading(false);
        return;
    }
    const q = query(
      collection(firestore, 'withdrawalRequests'), 
      where('status', '==', 'pending'), 
      orderBy('requestedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      async (snapshot) => {
        const newRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest));
        
        const requestsWithUsers = await Promise.all(newRequests.map(async (request) => {
            try {
                const userDoc = await getDoc(doc(firestore, 'users', request.userId));
                if (userDoc.exists()) {
                    return { ...request, user: { id: userDoc.id, ...userDoc.data() } as User };
                }
            } catch (error) {
                console.error(`Failed to fetch user ${request.userId}`, error);
            }
            return { ...request, user: undefined };
        }));

        setRequests(requestsWithUsers);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching withdrawal requests:", err);
        toast.error("Failed to load requests.", { description: err.message });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore]);

  const handleProcessRequest = async (requestId: string, approve: boolean) => {
    if (!processWithdrawalFunction) {
        toast.error('Functions service not ready.');
        return;
    }
    setIsSubmitting(prev => ({ ...prev, [requestId]: true }));
    try {
      const result = await processWithdrawalFunction({ requestId, approve });
      const responseData = (result.data as any);
      if (responseData.status === 'success') {
        toast.success(`Request ${approve ? 'Approved' : 'Rejected'}`, { 
          description: responseData.message,
        });
      } else {
        throw new Error(responseData.message || 'Failed to process request.');
      }
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
          <CardTitle className="flex items-center"><ListChecks className="mr-2"/> Withdrawal Requests</CardTitle>
          <CardDescription>Review and process pending withdrawal requests from users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
             <div className="space-y-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          )}
          {!loading && requests.length === 0 && (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold">All Caught Up!</h3>
                <p className="text-muted-foreground mt-1">There are no pending withdrawal requests.</p>
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
