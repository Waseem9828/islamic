'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, QuerySnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase/provider'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Copy, Banknote, User, Image as ImageIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface Request {
  id: string;
  amount: number;
  transactionId: string;
  userId: string;
  requestedAt: { toDate: () => Date };
  screenshotUrl: string;
}

const RequestCard = ({ request, onProcess, isSubmitting }: { request: Request; onProcess: (id: string, approve: boolean) => void; isSubmitting: boolean }) => {
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

  return (
    <Card className="p-4 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
        <div className="md:col-span-2 space-y-2">
             <p className="font-bold text-2xl text-primary">₹{request.amount.toLocaleString()}</p>
             <div className='text-sm text-muted-foreground flex items-center gap-2 flex-wrap'>
                <p className="flex items-center gap-1">
                    <User className="h-3 w-3"/> <span className='font-mono'>{request.userId}</span>
                </p>
                <p className="flex items-center gap-1">
                    ID: <span className="font-mono">{request.transactionId}</span>
                    <button onClick={() => copyToClipboard(request.transactionId)} className="hover:text-primary"><Copy className="h-3 w-3"/></button>
                </p>
                 <Link href={request.screenshotUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                    <ImageIcon className="h-3 w-3"/> View Screenshot
                </Link>
             </div>
             <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
        <div className="flex gap-2 justify-self-start md:justify-self-end">
            <Button variant="outline" size="sm" onClick={() => onProcess(request.id, false)} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4 text-red-500"/>} Reject
            </Button>
            <Button size="sm" onClick={() => onProcess(request.id, true)} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>} Approve
            </Button>
        </div>
    </Card>
  );
};


export default function ManageDepositsPage() {
  const { firestore, functions } = useFirebase(); 
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const requestsQuery = query(
      collection(firestore, 'depositRequests'), 
      where('status', '==', 'pending'), 
      orderBy('requestedAt', 'desc')
    );

    const unsubscribe = onSnapshot(requestsQuery, 
      (snapshot: QuerySnapshot) => {
        const newRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Request));
        setRequests(newRequests);
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
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
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
