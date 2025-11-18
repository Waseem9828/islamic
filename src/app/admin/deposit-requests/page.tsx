
'use client';

import { useState, useMemo } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { firestore, functions } from '@/firebase/config';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const processDepositFunction = httpsCallable(functions, 'processDeposit');

export default function ManageDepositsPage() {
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

  const requestsQuery = useMemo(() => 
    query(
      collection(firestore, 'depositRequests'), 
      where('status', '==', 'pending'), 
      orderBy('requestedAt', 'desc')
    ), 
  []);

  const [requests, loading, error] = useCollection(requestsQuery);

  const handleProcessRequest = async (requestId: string, approve: boolean) => {
    setIsSubmitting(prev => ({ ...prev, [requestId]: true }));

    try {
      const result = await processDepositFunction({ requestId, approve });
      toast.success(`Request ${approve ? 'Approved' : 'Rejected'}`, { 
        description: result.data.message as string,
      });
    } catch (err: any) {
      console.error('Error processing request:', err);
      toast.error('Operation Failed', { description: err.message || 'An unknown error occurred.' });
    } finally {
      setIsSubmitting(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.info('Copied to clipboard');
  }

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
          <CardTitle>Deposit Requests</CardTitle>
          <CardDescription>Review and process pending deposit requests. Approving a request will add the funds and bonus to the user's wallet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requests && requests.docs.length === 0 && (
            <p className="text-center text-muted-foreground py-6">No pending deposit requests.</p>
          )}
          {requests && requests.docs.map(doc => {
            const request = doc.data();
            const requestId = doc.id;
            return (
              <Card key={requestId} className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <p className="font-bold text-lg">₹{request.amount}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            Transaction ID: <span className="font-mono">{request.transactionId}</span>
                            <button onClick={() => copyToClipboard(request.transactionId)}><Copy className="h-3 w-3"/></button>
                        </p>
                        <p className="text-xs text-muted-foreground">User ID: {request.userId}</p>
                        <p className="text-xs text-muted-foreground">Requested {formatDistanceToNow(request.requestedAt.toDate())} ago</p>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                        <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessRequest(requestId, false)}
                            disabled={isSubmitting[requestId]}
                        >
                            {isSubmitting[requestId] ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4"/>}
                            Reject
                        </Button>
                        <Button 
                            size="sm"
                            onClick={() => handleProcessRequest(requestId, true)}
                            disabled={isSubmitting[requestId]}    
                        >
                            {isSubmitting[requestId] ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>}
                            Approve
                        </Button>
                    </div>
                </div>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
