
'use client';

import { useEffect, useState } from 'react';
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

const TransactionTable = ({ transactions, type, onAction, isLoading }: { transactions: (Deposit | Withdrawal)[], type: 'deposit' | 'withdrawal', onAction: (id: string, action: string) => void, isLoading: boolean }) => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Amount (₹)</TableHead>
                <TableHead>Date</TableHead>
                {type === 'withdrawal' && <TableHead>UPI ID</TableHead>}
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
                    <TableRow key={tx.id}>
                        <TableCell className="font-mono">{tx.userId}</TableCell>
                        <TableCell>₹{tx.amount.toLocaleString('en-IN')}</TableCell>
                        <TableCell>{new Date(tx.timestamp.seconds * 1000).toLocaleString()}</TableCell>
                        {type === 'withdrawal' && <TableCell>{(tx as Withdrawal).upiId}</TableCell>}
                        <TableCell className="text-right space-x-2">
                            {type === 'deposit' && (
                                <>
                                    <Button size="sm" variant="outline" className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600" onClick={() => onAction(tx.id, 'approved')}><CheckCircle className="mr-2 h-4 w-4"/>Approve</Button>
                                    <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => onAction(tx.id, 'rejected')}><XCircle className="mr-2 h-4 w-4"/>Reject</Button>
                                </>
                            )}
                            {type === 'withdrawal' && (
                                <>
                                    <Button size="sm" variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600" onClick={() => onAction(tx.id, 'completed')}><CheckCircle className="mr-2 h-4 w-4"/>Complete</Button>
                                    <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => onAction(tx.id, 'rejected')}><XCircle className="mr-2 h-4 w-4"/>Reject</Button>
                                </>
                            )}
                        </TableCell>
                    </TableRow>
                ))
            )}
        </TableBody>
    </Table>
);

export default function TransactionsHubPage() {
    const { functions } = useFirebase();
    const [pendingDeposits, setPendingDeposits] = useState<Deposit[]>([]);
    const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // Tracks ID of transaction being actioned

    const fetchTransactions = async () => {
        setIsLoading(true);
        try {
            const getPendingTransactionsFn = httpsCallable(functions, 'getPendingTransactions');
            const result = await getPendingTransactionsFn();
            const data = result.data as { deposits: Deposit[], withdrawals: Withdrawal[] };
            setPendingDeposits(data.deposits || []);
            setPendingWithdrawals(data.withdrawals || []);
        } catch (err: any) {
            toast.error("Failed to fetch transactions", { description: err.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [functions]);

    const handleAction = async (id: string, action: string, type: 'deposit' | 'withdrawal') => {
        setActionLoading(id);
        const toastId = toast.loading(`Processing ${type}...`);
        
        const functionName = type === 'deposit' ? 'handleDepositByAdmin' : 'handleWithdrawalByAdmin';
        const payload = type === 'deposit' ? { depositId: id, action } : { withdrawalId: id, action };

        try {
            const callableFn = httpsCallable(functions, functionName);
            await callableFn(payload);
            toast.success(`Transaction ${action} successfully.`, { id: toastId });
            fetchTransactions(); // Refresh the list
        } catch (err: any) {
            toast.error(err.message, { id: toastId });
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Transactions Hub</h1>
                <p className="text-muted-foreground">Approve deposits and complete withdrawals.</p>
            </div>

            <Tabs defaultValue="deposits">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="deposits">
                        <Badge className="mr-2">{pendingDeposits.length}</Badge> Pending Deposits
                    </TabsTrigger>
                    <TabsTrigger value="withdrawals">
                        <Badge className="mr-2">{pendingWithdrawals.length}</Badge> Pending Withdrawals
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="deposits">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Deposit Requests</CardTitle>
                            <CardDescription>Review and approve or reject these deposit requests.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TransactionTable transactions={pendingDeposits} type="deposit" onAction={(id, action) => handleAction(id, action, 'deposit')} isLoading={isLoading} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="withdrawals">
                     <Card>
                        <CardHeader>
                            <CardTitle>Pending Withdrawal Requests</CardTitle>
                            <CardDescription>Users have requested these withdrawals. Complete them after verifying payment.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TransactionTable transactions={pendingWithdrawals} type="withdrawal" onAction={(id, action) => handleAction(id, action, 'withdrawal')} isLoading={isLoading} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
