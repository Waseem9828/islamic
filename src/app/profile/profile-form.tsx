'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut, UserCog, Wallet, Loader2, Save, User as UserIcon } from 'lucide-react';
import { useUser, useFirebase } from '@/firebase/provider';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadFile } from '@/firebase/storage';

export function ProfileForm() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { auth, firestore } = useFirebase(); // Correctly use the hook
  
  const [displayName, setDisplayName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState('');

  useEffect(() => {
    if (user && firestore) {
      setAvatarSrc(user.photoURL || `https://avatar.vercel.sh/${user.email}.png`);
      setDisplayName(user.displayName || '');

      const userDocRef = doc(firestore, "users", user.uid);
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
          setUpiId(docSnap.data().upiId || '');
        }
      });
    }
  }, [user, firestore]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast.error("Failed to log out.");
    }
  };
  
  const handlePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !auth?.currentUser || !firestore) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const downloadURL = await uploadFile(file, user.uid, 'profile-pictures');

      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      
      const userDocRef = doc(firestore, "users", user.uid);
      await updateDoc(userDocRef, { photoURL: downloadURL });
      
      setAvatarSrc(downloadURL);
      toast.success("Profile picture updated!");
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "An unknown error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileSave = async () => {
    if (!user || !firestore || !auth?.currentUser) return;

    setIsSaving(true);
    
    try {
        if (auth.currentUser.displayName !== displayName) {
            await updateProfile(auth.currentUser, { displayName });
        }
        
        const userDocRef = doc(firestore, "users", user.uid);
        await updateDoc(userDocRef, {
            displayName: displayName,
            upiId: upiId,
        });

        toast.success("Profile saved successfully!");
    } catch (error) {
        console.error("Error saving profile:", error);
        toast.error("Failed to save profile.");
    } finally {
        setIsSaving(false);
    }
  };

  if (isUserLoading || !user) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto p-4">
        <Card className="md:col-span-1">
             <CardHeader className="text-center">
                <div className="relative mx-auto w-24 h-24 mb-4">
                    <label htmlFor="picture" className="cursor-pointer rounded-full">
                        <Avatar className="w-full h-full">
                            <AvatarImage src={avatarSrc} alt={displayName || 'User'} />
                            <AvatarFallback>{displayName ? displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}</AvatarFallback>
                        </Avatar>
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                                <Loader2 className="w-8 h-8 animate-spin text-white" />
                            </div>
                        )}
                    </label>
                </div>
                <Input
                    id="picture"
                    type="file"
                    accept="image/*"
                    onChange={handlePictureUpload}
                    className="hidden"
                    disabled={isUploading}
                />
                <label htmlFor="picture" className="cursor-pointer">
                    <Button asChild disabled={isUploading} variant="link">
                    <span>Change Picture</span>
                    </Button>
                </label>
                <CardTitle className="text-xl">{displayName || user.email}</CardTitle>
                <p className="text-sm text-gray-500 font-mono">{user.uid}</p>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-between" onClick={() => router.push('/wallet')}>
                        <div className="flex items-center">
                        <Wallet className="mr-2 h-4 w-4" />
                        <span>My Wallet</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" className="w-full justify-between" onClick={() => router.push('/admin')}>
                        <div className="flex items-center">
                        <UserCog className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
            <CardFooter>
                <Button variant="destructive" className="w-full" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
                </Button>
            </CardFooter>
        </Card>
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center"><UserIcon className="mr-2"/>Personal Information</CardTitle>
                <CardDescription>Update your display name and UPI ID for withdrawals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Enter your name" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user.email || ''} disabled />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="upiId">Default UPI ID</Label>
                    <Input id="upiId" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@bank" />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleProfileSave} disabled={isSaving || isUploading}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
