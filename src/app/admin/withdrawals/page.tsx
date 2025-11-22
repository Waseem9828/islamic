'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, QuerySnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, ListChecks } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface WithdrawalRequest {
    id: string;
    amount: number;
    upiId: string;
    userId: string;
    requestedAt: { toDate: () => Date };
}

export default function ManageWithdrawalsPage() {
  const { firestore, functions } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const processWithdrawalFunction = useMemo(() => {
    if (!functions) return null;
    return httpsCallable(functions, 'processWithdrawal');
  }, [functions]);

  useEffect(() => {
    if (!firestore) {
        setLoading(false);
        setError(new Error("Firestore not available"));
        return;
    }
    const q = query(
      collection(firestore, 'withdrawalRequests'), 
      where('status', '==', 'pending'), 
      orderBy('requestedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot: QuerySnapshot) => {
        const newRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithdrawalRequest));
        setRequests(newRequests);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching withdrawal requests:", err);
        setError(err);
        setLoading(false);
        toast.error("Failed to load requests.");
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
      const responseData = (result.data as any).result as { status: string; message: string };
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

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error loading requests: {error.message}</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ListChecks className="mr-2"/> Withdrawal Requests</CardTitle>
          <CardDescription>Review and process pending withdrawal requests from users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requests.length === 0 && (
            <p className="text-center text-muted-foreground py-6">No pending withdrawal requests.</p>
          )}
          {requests.map(request => (
              <Card key={request.id} className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <p className="font-bold text-lg">₹{request.amount}</p>
                        <p className="text-sm text-muted-foreground">To: <span className="font-mono">{request.upiId}</span></p>
                        <p className="text-xs text-muted-foreground">User: {request.userId}</p>
                        <p className="text-xs text-muted-foreground">Requested {formatDistanceToNow(request.requestedAt.toDate())} ago</p>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                        <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessRequest(request.id, false)}
                            disabled={isSubmitting[request.id]}
                        >
                            {isSubmitting[request.id] ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4"/>}
                            Reject
                        </Button>
                        <Button 
                            size="sm"
                            onClick={() => handleProcessRequest(request.id, true)}
                            disabled={isSubmitting[request.id]}    
                        >
                            {isSubmitting[request.id] ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                            Approve
                        </Button>
                    </div>
                </div>
              </Card>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
