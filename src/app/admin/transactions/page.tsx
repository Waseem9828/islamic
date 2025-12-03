
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Deposit } from '@/lib/firebase/collections/transactions_deposit';
import { Withdrawal } from '@/lib/firebase/collections/transactions_withdraw';

// Memoized row for performance, prevents re-renders of unchanged rows
const MemoizedTransactionRow = React.memo(({ tx, type, onAction, actionLoading }) => {
    const isThisRowLoading = actionLoading === tx.id;

    const handleAction = (action) => {
        onAction(tx.id, action, tx.amount, tx.userId);
    }

    return (
        <TableRow key={tx.id}>
            <TableCell className="font-mono">{tx.userId}</TableCell>
            <TableCell>₹{tx.amount.toLocaleString('en-IN')}</TableCell>
            <TableCell>{new Date(tx.timestamp.seconds * 1000).toLocaleString()}</TableCell>
            {type === 'withdrawal' && <TableCell>{(tx as Withdrawal).upiId}</TableCell>}
            {type === 'deposit' && <TableCell>{(tx as Deposit).transactionId}</TableCell>}
            <TableCell className="text-right space-x-2">
                 <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
                    onClick={() => handleAction('approved')}
                    disabled={isThisRowLoading} >
                    {isThisRowLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4"/>}
                    Approve
                </Button>
                <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600" 
                    onClick={() => handleAction('rejected')}
                    disabled={isThisRowLoading} >
                    {isThisRowLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4"/>}
                    Reject
                </Button>
            </TableCell>
        </TableRow>
    );
});

// High-performance table using memoized rows
const TransactionTable = ({ transactions, type, onAction, isLoading, actionLoading }) => (
    <Table>
        <TableHeader> 
            <TableRow> 
                <TableHead>User ID</TableHead> 
                <TableHead>Amount (₹)</TableHead> 
                <TableHead>Date</TableHead> 
                {type === 'withdrawal' && <TableHead>UPI ID</TableHead>}
                {type === 'deposit' && <TableHead>Transaction ID</TableHead>}
                <TableHead className="text-right">Actions</TableHead> 
            </TableRow> 
        </TableHeader>
        <TableBody>
            {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" /></TableCell></TableRow>
            ) : transactions.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center">No pending {type}s.</TableCell></TableRow>
            ) : (
                transactions.map((tx) => (
                    <MemoizedTransactionRow key={tx.id} tx={tx} type={type} onAction={onAction} actionLoading={actionLoading} />
                ))
            )}
        </TableBody>
    </Table>
);

export default function TransactionsHubPage() {
    const { functions } = useFirebase();
    const [transactions, setTransactions] = useState<{deposits: Deposit[], withdrawals: Withdrawal[]}>({deposits: [], withdrawals: []});
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Memoize callable functions for performance
    const getPendingTransactionsFn = useMemo(() => httpsCallable(functions, 'getPendingTransactions'), [functions]);
    const handleWithdrawalFn = useMemo(() => httpsCallable(functions, 'handleWithdrawalByAdmin'), [functions]);
    const handleDepositFn = useMemo(() => httpsCallable(functions, 'handleDepositByAdmin'), [functions]);

    const fetchTransactions = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getPendingTransactionsFn();
            setTransactions(result.data as any);
        } catch (err: any) { toast.error("Failed to fetch transactions", { description: err.message });
        } finally { setIsLoading(false); }
    }, [getPendingTransactionsFn]);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    // Optimized action handler using optimistic UI update
    const handleWithdrawalAction = useCallback(async (id: string, action: string) => {
        setActionLoading(id);
        const toastId = toast.loading(`Processing withdrawal...`);
        
        // Optimistic UI update: remove the item from the list immediately
        setTransactions(prev => ({
            ...prev,
            withdrawals: prev.withdrawals.filter(tx => tx.id !== id)
        }));

        try {
            await handleWithdrawalFn({ withdrawalId: id });
            toast.success(`Withdrawal completed successfully.`, { id: toastId });
            // No need to re-fetch, UI is already updated. 
            // You might re-fetch periodically or with a manual refresh button.
        } catch (err: any) {
            toast.error(err.message, { id: toastId });
            // Revert UI on failure
            fetchTransactions(); 
        } finally {
            setActionLoading(null);
        }
    }, [handleWithdrawalFn, fetchTransactions]);

    const handleDepositAction = useCallback(async (id: string, action: 'approved' | 'rejected') => {
        setActionLoading(id);
        const toastId = toast.loading(`Processing deposit...`);

        setTransactions(prev => ({
            ...prev,
            deposits: prev.deposits.filter(tx => tx.id !== id)
        }));

        try {
            await handleDepositFn({ depositId: id, action });
            toast.success(`Deposit ${action} successfully.`, { id: toastId });
        } catch (err: any) {
            toast.error(err.message, { id: toastId });
            fetchTransactions();
        } finally {
            setActionLoading(null);
        }
    }, [handleDepositFn, fetchTransactions]);

    return (
        <div className="space-y-6">
            <div> <h1 className="text-2xl font-bold">High-Performance Transactions Hub</h1> <p className="text-muted-foreground">Processing thousands of transactions per minute.</p> </div>
            <Tabs defaultValue="deposits">
                <TabsList> <TabsTrigger value="deposits">Deposits</TabsTrigger> <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger> </TabsList>
                <TabsContent value="deposits">
                    <Card>
                        <CardHeader> <CardTitle>Pending Deposits</CardTitle> <CardDescription>Approve or reject deposit requests.</CardDescription> </CardHeader>
                        <CardContent>
                            <TransactionTable transactions={transactions.deposits} type="deposit" onAction={handleDepositAction} isLoading={isLoading} actionLoading={actionLoading} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="withdrawals">
                    <Card>
                        <CardHeader> <CardTitle>Pending Withdrawals</CardTitle> <CardDescription>Withdrawals are processed asynchronously and atomically.</CardDescription> </CardHeader>
                        <CardContent>
                            <TransactionTable transactions={transactions.withdrawals} type="withdrawal" onAction={handleWithdrawalAction} isLoading={isLoading} actionLoading={actionLoading} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
