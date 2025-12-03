
'use client';

import { useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useFirebase } from '@/firebase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Wallet, Loader2 } from 'lucide-react';
import { Admin } from '@/lib/firebase/collections/admins';

// Dialog for creating a new worker admin
const CreateAdminDialog = ({ isOpen, onClose, onAdminCreated }: { isOpen: boolean; onClose: () => void; onAdminCreated: () => void; }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { functions } = useFirebase();

    const handleSubmit = async () => {
        if (!name || !email || !password) {
            toast.error("Please fill all fields.");
            return;
        }
        if (!functions) {
            toast.error("Firebase functions are not available.");
            return;
        }
        setIsLoading(true);
        const toastId = toast.loading("Creating admin...");
        try {
            const createWorkerAdminFn = httpsCallable(functions, 'createWorkerAdmin');
            await createWorkerAdminFn({ name, email, password });
            toast.success("Worker admin created successfully!", { id: toastId });
            onAdminCreated();
            onClose();
        } catch (err: any) {
            toast.error(err.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={isOpen => !isOpen && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Worker Admin</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Admin
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Dialog for adding balance to a worker's wallet
const AddBalanceDialog = ({ isOpen, onClose, onBalanceAdded, admin }: { isOpen: boolean; onClose: () => void; onBalanceAdded: () => void; admin: Admin | null; }) => {
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { functions } = useFirebase();

    const handleSubmit = async () => {
        const parsedAmount = parseFloat(amount);
        if (!admin || !parsedAmount || parsedAmount <= 0) {
            toast.error("Please enter a valid positive amount.");
            return;
        }
        if (!functions) {
            toast.error("Firebase functions are not available.");
            return;
        }
        setIsLoading(true);
        const toastId = toast.loading("Adding balance...");
        try {
            const addBalanceFn = httpsCallable(functions, 'addBalanceToAdminWallet');
            await addBalanceFn({ adminId: admin.id, amount: parsedAmount });
            toast.success(`₹${parsedAmount} added to ${admin.name}'s wallet.`, { id: toastId });
            onBalanceAdded();
            onClose();
        } catch (err: any) {
            toast.error(err.message, { id: toastId });
        } finally {
            setIsLoading(false);
            setAmount('');
        }
    };
    
    if (!admin) return null;

    return (
        <Dialog open={isOpen} onOpenChange={isOpen => !isOpen && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Balance to Wallet</DialogTitle>
                    <DialogDescription>Add funds to {admin.name}'s wallet. This action will be logged.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 5000" />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm & Add Balance
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// Main page component
export default function ManageAdminsPage() {
    const { functions } = useFirebase();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [isAddBalanceDialogOpen, setAddBalanceDialogOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

    const fetchAdmins = async () => {
        if (!functions) {
            toast.error("Firebase functions are not available.");
            return;
        }
        setIsLoading(true);
        try {
            // This function needs to be created in the backend
            const getAllAdminsFn = httpsCallable(functions, 'getAllAdmins');
            const result = await getAllAdminsFn();
            setAdmins(result.data as Admin[]);
        } catch (err: any) {
            toast.error("Failed to fetch admins", { description: err.message });
            setAdmins([]); // Clear admins on error
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, [functions]);
    
    const handleOpenAddBalance = (admin: Admin) => {
        setSelectedAdmin(admin);
        setAddBalanceDialogOpen(true);
    }

    return (
        <div className="space-y-6">
            <CreateAdminDialog 
                isOpen={isCreateDialogOpen} 
                onClose={() => setCreateDialogOpen(false)}
                onAdminCreated={fetchAdmins}
            />
            <AddBalanceDialog
                isOpen={isAddBalanceDialogOpen}
                onClose={() => { setAddBalanceDialogOpen(false); setSelectedAdmin(null); }}
                onBalanceAdded={fetchAdmins}
                admin={selectedAdmin}
            />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Admin Management</h1>
                    <p className="text-muted-foreground">Create worker admins and manage their wallet balances.</p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" /> Create Worker Admin
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Admins List</CardTitle>
                    <CardDescription>A list of all worker and super admins in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Current Balance (₹)</TableHead>
                                <TableHead className="text-right">Total Added (₹)</TableHead>
                                <TableHead className="text-right">Total Used (₹)</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            ) : admins.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">No admins found or you don't have permission.</TableCell>
                                </TableRow>
                            ) : (
                                admins.map((admin) => (
                                    <TableRow key={admin.id}>
                                        <TableCell className="font-medium">{admin.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={admin.role === 'super' ? 'destructive' : 'secondary'}>
                                                {admin.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            {admin.wallet.currentBalance.toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600">
                                            {admin.wallet.totalAdded.toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell className="text-right text-red-600">
                                            {admin.wallet.totalUsed.toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {admin.role === 'worker' && (
                                                <Button variant="outline" size="sm" onClick={() => handleOpenAddBalance(admin)}>
                                                    <Wallet className="mr-2 h-4 w-4"/> Add Balance
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
