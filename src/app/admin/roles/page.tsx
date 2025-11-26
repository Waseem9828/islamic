
'use client';

import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFirebase, useUser } from '@/firebase';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ShieldCheck, ShieldOff, Search, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface FoundUser {
    uid: string;
    displayName: string;
    email: string;
    photoURL?: string;
    isAdmin: boolean;
}

export default function AdminRolesPage() {
    const { functions, firestore } = useFirebase();
    const { user: adminUser, isAdmin } = useUser();

    const [searchQuery, setSearchQuery] = useState('');
    const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogState, setDialogState] = useState<{ open: boolean; user: FoundUser | null; action: 'grant' | 'revoke' | null }>({ open: false, user: null, action: null });

    const handleSearch = async () => {
        if (!searchQuery.trim() || !firestore) return;
        setIsSearching(true);
        setFoundUser(null);

        try {
            // Search by UID first
            let userQuery = query(collection(firestore, 'users'), where('__name__', '==', searchQuery.trim()));
            let userSnapshot = await getDocs(userQuery);

            // If not found by UID, search by email
            if (userSnapshot.empty) {
                userQuery = query(collection(firestore, 'users'), where('email', '==', searchQuery.trim()));
                userSnapshot = await getDocs(userQuery);
            }

            if (userSnapshot.empty) {
                toast.error("Search Error", { description: "No user found with that UID or email." });
                return;
            }

            const userDoc = userSnapshot.docs[0];
            const userData = userDoc.data();

            // Check if the user is an admin
            const adminRoleRef = collection(firestore, 'roles_admin');
            const adminSnapshot = await getDocs(query(adminRoleRef, where('__name__', '==', userDoc.id)));

            setFoundUser({
                uid: userDoc.id,
                displayName: userData.displayName || 'N/A',
                email: userData.email,
                photoURL: userData.photoURL,
                isAdmin: !adminSnapshot.empty,
            });
        } catch (error) {
            console.error("Error searching for user:", error);
            toast.error("Search Error", { description: "An unexpected error occurred during search." });
        } finally {
            setIsSearching(false);
        }
    };

    const openConfirmationDialog = (user: FoundUser, action: 'grant' | 'revoke') => {
        if (user.uid === adminUser?.uid) {
            toast.warning("Action Not Allowed", { description: "You cannot change your own admin status." });
            return;
        }
        setDialogState({ open: true, user, action });
    };

    const handleRoleChange = async () => {
        if (!dialogState.user || !dialogState.action || !functions) return;

        setIsSubmitting(true);
        const manageAdminRoleFn = httpsCallable(functions, 'manageAdminRole');

        try {
            const result = await manageAdminRoleFn({ uid: dialogState.user.uid, action: dialogState.action });
            // @ts-ignore
            toast.success(dialogState.action === 'grant' ? "Admin Granted" : "Admin Revoked", { description: result.data.message });
            // Update UI
            setFoundUser(prev => prev ? { ...prev, isAdmin: dialogState.action === 'grant' } : null);
        } catch (error: any) {
            console.error("Error changing admin role:", error);
            toast.error("Operation Failed", { description: error.message || "An unknown error occurred." });
        } finally {
            setIsSubmitting(false);
            setDialogState({ open: false, user: null, action: null });
        }
    };

    if (!isAdmin) {
        return <p className="p-4 text-center text-muted-foreground">You do not have permission to view this page.</p>;
    }

    return (
        <div className="mx-auto max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><ShieldCheck className="mr-2" /> Manage Admin Roles</CardTitle>
                    <CardDescription>Grant or revoke admin privileges for users.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-6">
                        <div className="flex-grow">
                           <Label htmlFor="search-user" className="sr-only">Search User</Label>
                           <Input
                                id="search-user"
                                type="text"
                                placeholder="Enter User UID or Email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={isSearching}>
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            <span className="ml-2 hidden sm:inline">Search</span>
                        </Button>
                    </div>

                    {foundUser && (
                        <Card className="bg-muted/50">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={foundUser.photoURL} />
                                        <AvatarFallback>{foundUser.displayName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{foundUser.displayName}</p>
                                        <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                                        <p className="text-xs font-mono text-muted-foreground">{foundUser.uid}</p>
                                    </div>
                                </div>
                                {
                                    foundUser.isAdmin ? (
                                        <Button variant="destructive" onClick={() => openConfirmationDialog(foundUser, 'revoke')}>
                                            <ShieldOff className="mr-2 h-4 w-4" /> Revoke Admin
                                        </Button>
                                    ) : (
                                        <Button variant="default" className='bg-green-600 hover:bg-green-700' onClick={() => openConfirmationDialog(foundUser, 'grant')}>
                                            <ShieldCheck className="mr-2 h-4 w-4" /> Grant Admin
                                        </Button>
                                    )
                                }
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={dialogState.open} onOpenChange={(open) => setDialogState(prev => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to {dialogState.action} admin privileges for <span className="font-semibold">{dialogState.user?.displayName}</span>.
                            This action can be reversed later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRoleChange} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
