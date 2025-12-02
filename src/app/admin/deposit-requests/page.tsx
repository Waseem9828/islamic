
'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase/provider'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Copy, Banknote, Image as ImageIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import Image from 'next/image';
import { LoadingScreen } from '@/components/ui/loading';

// --- Type Definitions ---
interface User {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}
interface Request {
  id: string;
  amount: number;
  transactionId: string;
  userId: string;
  requestedAt: { toDate: () => Date };
  screenshotUrl?: string; 
}
type RequestWithUser = Request & { user?: User };

const RequestCard = ({ request, onProcess, isSubmitting }: { request: RequestWithUser, onProcess: (id: string, approve: boolean) => void, isSubmitting: boolean }) => {
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
            <CardContent className="p-4 pt-0 space-y-4">
                <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-bold text-lg">₹{request.amount.toLocaleString()}</span>
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-mono text-muted-foreground break-all">UTR: {request.transactionId}</p>
                    {request.screenshotUrl && (
                        <a href={request.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                           <ImageIcon className="h-4 w-4"/> View Screenshot
                        </a>
                    )}
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


// --- Main Page Component ---
export default function ManageDepositsPage() {
  const { firestore, functions } = useFirebase(); 
  const [requests, setRequests] = useState<RequestWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const isMobile = useIsMobile();

  // --- Data Fetching ---
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
                console.error(`Failed to fetch user for ${request.userId}`, error);
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
  
  const filteredRequests = useMemo(() => {
      if (!globalFilter) return requests;
      return requests.filter(req => {
          const user = req.user;
          const search = globalFilter.toLowerCase();
          return (
              user?.displayName?.toLowerCase().includes(search) ||
              user?.email?.toLowerCase().includes(search) ||
              req.userId.toLowerCase().includes(search) ||
              req.transactionId.toLowerCase().includes(search)
          );
      });
  }, [requests, globalFilter]);

  const processDepositFunction = useMemo(() => {
      if (!functions) return null;
      return httpsCallable(functions, 'processDeposit');
  }, [functions]);

  // --- Actions ---
  const handleProcessRequest = async (requestId: string, approve: boolean) => {
    if (!processDepositFunction) { 
      toast.error('Functions service is not available.'); 
      return; 
    }
    setIsSubmitting(prev => ({ ...prev, [requestId]: true }));
    
    try {
      const result = await processDepositFunction({ requestId, action: approve ? 'approve' : 'reject' });
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
  
  // --- Render ---
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Banknote className="mr-2"/>Deposit Requests</CardTitle>
        <CardDescription>Review and process pending deposit requests. Approving a request will add the funds and bonus to the user's wallet.</CardDescription>
        <div className="flex items-center pt-4">
            <Input
                placeholder="Search by name, email, UTR..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="max-w-sm"
            />
        </div>
      </CardHeader>
      <CardContent>
          {loading ? (
            <LoadingScreen text="Loading Requests..." />
          ) : isMobile ? (
              <div className="space-y-4">
                  {filteredRequests.length > 0 ? (
                      filteredRequests.map(req => (
                          <RequestCard key={req.id} request={req} onProcess={handleProcessRequest} isSubmitting={isSubmitting[req.id]} />
                      ))
                  ) : <p className="text-center text-muted-foreground p-8">No pending requests found.</p>
                  }
              </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredRequests.length > 0 ? (
                      filteredRequests.map(req => (
                          <RequestCard key={req.id} request={req} onProcess={handleProcessRequest} isSubmitting={isSubmitting[req.id]} />
                      ))
                  ) : <p className="text-center text-muted-foreground p-8 col-span-full">No pending requests found.</p>
                  }
              </div>
          )}
      </CardContent>
    </Card>
  );
}
