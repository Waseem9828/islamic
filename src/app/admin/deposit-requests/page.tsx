
'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase/provider'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Copy, Banknote, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { getCoreRowModel, getSortedRowModel, getFilteredRowModel, useReactTable } from '@tanstack/react-table';
import { Input } from '@/components/ui/input';

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

// --- Main Page Component ---
export default function ManageDepositsPage() {
  const { firestore, functions } = useFirebase(); 
  const [requests, setRequests] = useState<RequestWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'requestedAt', desc: true }]);
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

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
        
        // Fetch user data for each request more efficiently
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

  // --- Table Columns ---
  const columns = useMemo<ColumnDef<RequestWithUser>[]>(() => [
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original.user;
        const userIdentifier = user?.email || row.original.userId;
        const userDisplayName = user?.displayName || user?.email || 'Unknown';
        return (
            <div className="flex items-center gap-2">
                <Avatar className="h-9 w-9 border">
                    <AvatarImage src={user?.photoURL || `https://avatar.vercel.sh/${userIdentifier}.png`} alt={userDisplayName} />
                    <AvatarFallback>{userDisplayName[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold text-sm">{userDisplayName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{row.original.userId}</p>
                </div>
            </div>
        )
      }
    },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <div className="font-bold text-lg text-primary">₹{row.original.amount.toLocaleString()}</div> },
    { accessorKey: 'transactionId', header: 'UTR/Txn ID', cell: ({ row }) => (
        <div className="font-mono text-xs flex items-center gap-1">
            {row.original.transactionId} 
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {navigator.clipboard.writeText(row.original.transactionId); toast.info('Copied to clipboard');}}>
                <Copy className="h-3 w-3"/>
            </Button>
        </div>
    )},
    { accessorKey: 'requestedAt', header: 'Time', cell: ({ row }) => <div className="text-xs text-muted-foreground">{formatDistanceToNow(row.original.requestedAt.toDate(), { addSuffix: true })}</div> },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const request = row.original;
        const isActionSubmitting = isSubmitting[request.id];
        return (
            <div className="flex gap-2">
                {request.screenshotUrl && 
                  <Button variant="outline" size="sm" asChild>
                    <a href={request.screenshotUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4"/></a>
                  </Button>
                }
                <Button variant="outline" size="sm" onClick={() => handleProcessRequest(request.id, false)} disabled={isActionSubmitting}>
                    {isActionSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4 text-red-500"/>} Reject
                </Button>
                <Button size="sm" onClick={() => handleProcessRequest(request.id, true)} disabled={isActionSubmitting} className="bg-green-600 hover:bg-green-700">
                    {isActionSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>} Approve
                </Button>
            </div>
        )
      }
    },
  ], [isSubmitting]);

  // --- React Table Instance ---
  const table = useReactTable({
    data: requests,
    columns,
    state: { sorting, globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  
  // --- Render ---
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Banknote className="mr-2"/>Deposit Requests</CardTitle>
        <CardDescription>Review and process pending deposit requests. Approving a request will add the funds and bonus to the user's wallet.</CardDescription>
        <div className="flex items-center pt-4">
            <Input
                placeholder="Search requests..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="max-w-sm"
            />
        </div>
      </CardHeader>
      <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <DataTable table={table} columns={columns} />
          )}
      </CardContent>
    </Card>
  );
}
