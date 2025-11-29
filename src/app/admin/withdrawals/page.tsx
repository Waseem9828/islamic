
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Copy, ListChecks } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { LoadingScreen } from '@/components/ui/loading';


// --- Type Definitions ---
interface User {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}
interface WithdrawalRequest {
    id: string;
    amount: number;
    upiId: string;
    userId: string;
    requestedAt: { toDate: () => Date };
}
type RequestWithUser = WithdrawalRequest & { user?: User };

const WithdrawalCard = ({ request, onProcess, isSubmitting }: { request: RequestWithUser, onProcess: (id: string, approve: boolean) => void, isSubmitting: boolean }) => {
    const user = request.user;
    return (
        <Card className="w-full">
            <CardHeader className="p-4 flex flex-row items-center gap-3">
                 <Avatar className="h-10 w-10 border">
                    <AvatarImage src={user?.photoURL || `https://avatar.vercel.sh/${user?.email}.png`} alt={user?.displayName} />
                    <AvatarFallback>{user?.displayName?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold text-sm">{user?.displayName || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(request.requestedAt.toDate(), { addSuffix: true })}</p>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-bold text-lg">₹{request.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                    <p className="font-mono text-sm text-muted-foreground break-all">{request.upiId}</p>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {navigator.clipboard.writeText(request.upiId); toast.info('UPI ID Copied');}}>
                        <Copy className="h-4 w-4"/>
                    </Button>
                </div>
                <div className="flex gap-2">
                     <Button variant="outline" size="sm" className="w-full" onClick={() => onProcess(request.id, false)} disabled={isSubmitting}>
                        {isSubmitting ? <div className="loader"></div> : <><XCircle className="mr-2 h-4 w-4 text-red-500"/> Reject</>}
                    </Button>
                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700" onClick={() => onProcess(request.id, true)} disabled={isSubmitting}>
                        {isSubmitting ? <div className="loader"></div> : <><CheckCircle className="mr-2 h-4 w-4"/> Approve</>}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};


// --- Main Component ---
export default function ManageWithdrawalsPage() {
  const { firestore, functions } = useFirebase();
  const [requests, setRequests] = useState<RequestWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const isMobile = useIsMobile();

  const processWithdrawalFunction = useMemo(() => {
    if (!functions) return null;
    return httpsCallable(functions, 'processWithdrawal');
  }, [functions]);

  // --- Data Fetching ---
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
        
        const userCache = new Map<string, User>();
        const requestsWithUsers = await Promise.all(newRequests.map(async (request) => {
            if (userCache.has(request.userId)) {
                return { ...request, user: userCache.get(request.userId) };
            }
            try {
                const userDoc = await getDoc(doc(firestore, 'users', request.userId));
                if (userDoc.exists()) {
                    const userData = { id: userDoc.id, ...userDoc.data() } as User;
                    userCache.set(request.userId, userData);
                    return { ...request, user: userData };
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
  
  const filteredRequests = useMemo(() => {
      if (!globalFilter) return requests;
      return requests.filter(req => {
          const user = req.user;
          const search = globalFilter.toLowerCase();
          return (
              user?.displayName?.toLowerCase().includes(search) ||
              user?.email?.toLowerCase().includes(search) ||
              req.userId.toLowerCase().includes(search) ||
              req.upiId.toLowerCase().includes(search)
          );
      });
  }, [requests, globalFilter]);

  // --- Actions ---
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><ListChecks className="mr-2"/> Withdrawal Requests</CardTitle>
        <CardDescription>Review and process pending withdrawal requests from users.</CardDescription>
        <div className="flex items-center pt-4">
            <Input
                placeholder="Search by name, email, UPI ID..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="max-w-sm"
            />
        </div>
      </CardHeader>
      <CardContent>
          {loading ? (
             <LoadingScreen text="Loading Requests..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredRequests.length > 0 ? (
                    filteredRequests.map(req => (
                        <WithdrawalCard key={req.id} request={req} onProcess={handleProcessRequest} isSubmitting={isSubmitting[req.id]} />
                    ))
                ) : <p className="text-center text-muted-foreground p-8 col-span-full">No pending requests found.</p>
                }
            </div>
          )}
      </CardContent>
    </Card>
  );
}
