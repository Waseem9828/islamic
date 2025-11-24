'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirebase } from '@/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut, UserCog, Wallet, Loader2, Save, User as UserIcon, Camera } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";


export function ProfileForm() {
    const { auth, firestore, user } = useFirebase();
    const router = useRouter();
    
    const [displayName, setDisplayName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Effect to set initial form data once user is loaded
    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            // Fetch phone number from Firestore
            const userDocRef = doc(firestore!, 'users', user.uid);
            getDoc(userDocRef).then(docSnap => {
                if (docSnap.exists()) {
                    setPhoneNumber(docSnap.data().phoneNumber || '');
                }
            });
        }
    }, [user, firestore]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !auth) return;

        setIsSaving(true);
        setError('');
        const toastId = toast.loading('Saving profile...');

        try {
            // Update Firebase Auth profile
            await updateProfile(auth.currentUser!, { displayName });

            // Update Firestore user document
            const userDocRef = doc(firestore!, 'users', user.uid);
            await updateDoc(userDocRef, { displayName, phoneNumber });

            toast.success('Profile updated successfully!', { id: toastId });
        } catch (err) {
            console.error("Profile update error:", err);
            toast.error('Failed to update profile. Please try again.', { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !event.target.files || event.target.files.length === 0) return;
        
        const file = event.target.files[0];
        const storage = getStorage();
        const avatarRef = ref(storage, `avatars/${user.uid}/${file.name}`);

        setIsUploading(true);
        const toastId = toast.loading('Uploading avatar...');

        try {
            const snapshot = await uploadBytes(avatarRef, file);
            const photoURL = await getDownloadURL(snapshot.ref);

            // Update auth profile
            await updateProfile(user, { photoURL });
            // Update firestore doc
            const userDocRef = doc(firestore!, 'users', user.uid);
            await updateDoc(userDocRef, { photoURL });

            toast.success("Avatar updated!", { id: toastId });

        } catch (error) {
            console.error("Avatar upload error:", error);
            toast.error("Failed to upload avatar.", { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSignOut = async () => {
        if (!auth) return;
        await signOut(auth);
        toast.success("You have been signed out.");
        router.push('/login');
    };

    const getInitials = (name: string | null | undefined): string => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    if (!user) {
        return <div>Loading user profile...</div>; // Or a skeleton loader
    }

    return (
        <div className="grid gap-8 md:grid-cols-3">
            {/* Left Column: Navigation & Actions */}
            <div className="md:col-span-1">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center">
                             <div className="relative mb-4">
                                <Avatar className="w-24 h-24 text-3xl">
                                    <AvatarImage src={user.photoURL || undefined} />
                                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                                </Avatar>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    ref={fileInputRef} 
                                    onChange={handleAvatarUpload}
                                    hidden 
                                />
                                <Button 
                                    size="icon" 
                                    variant="outline"
                                    className="absolute bottom-0 right-0 rounded-full bg-background"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Camera className="h-4 w-4"/>}
                                </Button>
                            </div>
                            <h2 className="text-xl font-semibold">{user.displayName || 'User Name'}</h2>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <nav className="mt-6 space-y-1">
                            <ProfileNavItem icon={UserCog} label="Edit Profile" href="/profile" active />
                            <ProfileNavItem icon={Wallet} label="My Wallet" href="/wallet" />
                            <div className="pt-2 mt-2 border-t">
                                <button 
                                    onClick={handleSignOut}
                                    className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-red-500 hover:bg-red-500/10">
                                    <LogOut className="mr-3 h-5 w-5" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </nav>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Profile Form */}
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input id="displayName" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Enter your full name" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" value={user.email || ''} disabled placeholder="your@email.com" />
                                <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">Phone Number</Label>
                                <Input id="phoneNumber" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="Enter your phone number" />
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex justify-end">
                                <Button type="submit" disabled={isSaving || isUploading}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Helper component for navigation items
function ProfileNavItem({ icon: Icon, label, href, active = false }: { icon: React.ElementType, label: string, href: string, active?: boolean }) {
    const router = useRouter();
    return (
        <button 
            onClick={() => router.push(href)} 
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${active ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>
            <Icon className="mr-3 h-5 w-5" />
            <span>{label}</span>
            <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
        </button>
    );
}
