'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut, UserCog, Wallet, Loader2, Save, User as UserIcon, Camera } from 'lucide-react';
import { useUser, useFirebase } from '@/firebase/provider';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadFile } from '@/firebase/storage';
import { Separator } from '@/components/ui/separator';
import { useAdmin } from '@/hooks/useAdmin'; // Import the useAdmin hook

export function ProfileForm() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { auth, firestore } = useFirebase();
  const { isAdmin, isAdminLoading } = useAdmin(); // Use the admin hook

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
      // Correctly call uploadFile with folder and file name (user.uid)
      const downloadURL = await uploadFile(file, 'avatars', user.uid);

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

  if (isUserLoading || !user || isAdminLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card className="max-w-2xl mx-auto my-4 sm:my-8 shadow-lg">
        <CardHeader className="text-center items-center p-4 sm:p-6">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                <Avatar className="w-full h-full border-2 border-primary/20">
                    <AvatarImage src={avatarSrc} alt={displayName || 'User'} />
                    <AvatarFallback className="text-3xl">{displayName ? displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}</AvatarFallback>
                </Avatar>
                <label htmlFor="picture" className="absolute -bottom-2 -right-2 cursor-pointer p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-transform transform hover:scale-110">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </label>
                <Input
                    id="picture"
                    type="file"
                    accept="image/*"
                    onChange={handlePictureUpload}
                    className="hidden"
                    disabled={isUploading}
                />
            </div>
            <CardTitle className="text-xl sm:text-2xl mt-3 font-bold">{displayName || user.email}</CardTitle>
            <CardDescription className="text-xs sm:text-sm font-mono bg-muted px-2 py-1 rounded-md">UID: {user.uid}</CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold flex items-center"><UserIcon className="mr-2 h-5 w-5"/>Personal Information</h3>
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Enter your name" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={user.email || ''} disabled />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="upiId">Default UPI ID</Label>
                        <Input id="upiId" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@bank" />
                    </div>
                </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-2">
                <h3 className="text-lg font-semibold">Actions</h3>
                <Button variant="outline" className="w-full justify-between py-6 text-base" onClick={() => router.push('/wallet')}>
                    <div className="flex items-center"><Wallet className="mr-2 h-5 w-5" />My Wallet</div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Button>
                {isAdmin && (
                  <Button variant="outline" className="w-full justify-between py-6 text-base" onClick={() => router.push('/admin')}>
                      <div className="flex items-center"><UserCog className="mr-2 h-5 w-5" />Admin Panel</div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Button>
                )}
            </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 p-4 sm:p-6">
            <Button onClick={handleProfileSave} disabled={isSaving || isUploading} className="w-full py-6 text-base">
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                Save Changes
            </Button>
            <Button variant="destructive" className="w-full py-6 text-base" onClick={handleLogout}>
              <LogOut className="mr-2 h-5 w-5" />
              Logout
            </Button>
        </CardFooter>
    </Card>
  );
}

    