
"use client";
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { ChevronRight, Bell, Shield, LogOut, UserCog, Wallet, Loader2 } from 'lucide-react';
import { useUser, useFirebase } from '@/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';


const ProfilePage = () => {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { auth, storage, firestore } = useFirebase();
  const [isUploading, setIsUploading] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState('');

  useEffect(() => {
    if (user) {
      setAvatarSrc(user.photoURL || `https://avatar.vercel.sh/${user.email}.png`);
    }
  }, [user]);

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
    if (!user || !storage || !firestore || !auth.currentUser) return;
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const storageRef = ref(storage, `profile-pictures/${user.uid}`);

    try {
        await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(storageRef);

        // Update auth profile
        await updateProfile(auth.currentUser, { photoURL });
        
        // Update firestore document
        const userDocRef = doc(firestore, "users", user.uid);
        await updateDoc(userDocRef, { photoURL });
        
        setAvatarSrc(photoURL);
        toast.success("Profile picture updated successfully!");
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        toast.error("Failed to upload profile picture.");
    } finally {
        setIsUploading(false);
    }
  };


  if (isUserLoading || !user) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="relative mx-auto w-24 h-24 mb-4">
            <Avatar className="w-full h-full">
              <AvatarImage src={avatarSrc} alt={user.displayName || 'User'} />
              <AvatarFallback>{user.email ? user.email[0].toUpperCase() : 'U'}</AvatarFallback>
            </Avatar>
            {isUploading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-full">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}
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
          <CardTitle className="text-xl">{user.displayName || user.email}</CardTitle>
          <p className="text-sm text-gray-500">UID: {user.uid}</p>
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
            <Button variant="ghost" className="w-full justify-between">
              <div className="flex items-center">
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="w-full justify-between">
              <div className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                <span>Security</span>
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
    </div>
  );
};

export default ProfilePage;
