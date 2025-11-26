
'use client';

import { useState, useEffect } from 'react';
import { useFirebase, useUser } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Percent, IndianRupee, Loader2 } from 'lucide-react';

// Zod schema for form validation
const settingsSchema = z.object({
  adminCommissionRate: z.coerce.number().min(0).max(1, "Must be a fraction between 0 and 1 (e.g., 0.1 for 10%)"),
  depositBonusRate: z.coerce.number().min(0).max(1, "Must be a fraction between 0 and 1 (e.g., 0.05 for 5%)"),
  minEntryFee: z.coerce.number().int().min(0, "Cannot be negative"),
  minWithdrawalAmount: z.coerce.number().int().min(0, "Cannot be negative"),
  cancellationFee: z.coerce.number().int().min(0, "Cannot be negative"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AppSettingsPage() {
    const { firestore, functions } = useFirebase();
    const { isAdmin } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: async () => {
            setIsLoading(true);
            try {
                if (!firestore) return {} as SettingsFormValues;
                const settingsRef = doc(firestore, 'settings', 'rules');
                const settingsSnap = await getDoc(settingsRef);
                if (settingsSnap.exists()) {
                    return settingsSnap.data() as SettingsFormValues;
                }
                return {
                    adminCommissionRate: 0.1,
                    depositBonusRate: 0.05,
                    minEntryFee: 50,
                    minWithdrawalAmount: 300,
                    cancellationFee: 5,
                };
            } finally {
                setIsLoading(false);
            }
        }
    });

    const onSubmit = async (data: SettingsFormValues) => {
        if (!firestore) {
            toast.error("Firestore not available");
            return;
        }
        setIsSaving(true);
        try {
            const settingsRef = doc(firestore, 'settings', 'rules');
            await setDoc(settingsRef, data, { merge: true });
            toast.success("Settings Updated", { description: "App rules have been saved successfully." });
        } catch (error) {
            console.error("Error updating settings:", error);
            toast.error("Save Failed", { description: "Could not save the new app settings." });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isAdmin) {
        return <p className="p-4 text-center text-muted-foreground">You do not have permission to view this page.</p>;
    }
    
    if (isLoading) {
        return (
            <div className="mx-auto max-w-2xl">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-4 w-3/4 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-24" />
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><Settings className="mr-2" /> App Settings</CardTitle>
                            <CardDescription>Manage global application rules and parameters.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                            <FormField
                                control={form.control}
                                name="adminCommissionRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Admin Commission Rate</FormLabel>
                                        <div className="relative">
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <FormDescription>The fraction of the pot taken as commission (e.g., 0.1 for 10%).</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="depositBonusRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deposit Bonus Rate</FormLabel>
                                        <div className="relative">
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <FormDescription>Bonus awarded on deposits (e.g., 0.05 for 5%).</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="minEntryFee"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Minimum Match Entry Fee</FormLabel>
                                        <div className="relative">
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <IndianRupee className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <FormDescription>The minimum fee required to create a match.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="minWithdrawalAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Minimum Withdrawal Amount</FormLabel>
                                         <div className="relative">
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <IndianRupee className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <FormDescription>The minimum amount a user can request to withdraw.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="cancellationFee"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Match Cancellation Fee</FormLabel>
                                        <div className="relative">
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <IndianRupee className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <FormDescription>Fee charged when a creator cancels a match after players have joined.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save Changes
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
