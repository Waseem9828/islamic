'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Trash2, HardDrive, FileText, AlertTriangle, UserX } from 'lucide-react';
import { collection, getDocs, query, where, writeBatch, updateDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { deleteFileByUrl } from '@/firebase/storage';

export default function ManageStoragePage() {
  const { firestore } = useFirebase();
  const [bucketName, setBucketName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{ totalSize: string, fileCount: number } | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDepositCleaning, setIsDepositCleaning] = useState(false);
  const [isMatchWinningCleaning, setIsMatchWinningCleaning] = useState(false);
  const [isProfileCleaning, setIsProfileCleaning] = useState(false);

  const handleAnalyze = async () => {
    toast.info('This feature is a placeholder. No real analysis is performed.');
    // In a real app, you might have a backend function that uses GSUtil or a cloud API.
  };

  const handleCleanupSuccessfulDeposits = async () => {
    if (!firestore) return;
    if (!confirm('Are you sure you want to delete ALL screenshots from successful deposits? This is permanent.')) return;

    setIsDepositCleaning(true);
    const toastId = toast.loading('Starting cleanup of deposit screenshots...');
    try {
        const q = query(collection(firestore, 'depositRequests'), where('status', '==', 'approved'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            toast.info("No successful deposits found to clean up.", { id: toastId });
            setIsDepositCleaning(false);
            return;
        }

        toast.loading(`Found ${snapshot.size} approved deposits. Deleting files...`, { id: toastId });

        let deletedCount = 0;
        const batch = writeBatch(firestore);

        for (const doc of snapshot.docs) {
            const data = doc.data();
            if (data.screenshotURL && data.screenshotURL !== 'deleted') {
                try {
                    await deleteFileByUrl(data.screenshotURL);
                    batch.update(doc.ref, { screenshotURL: 'deleted' });
                    deletedCount++;
                } catch (error: any) {
                    console.error(`Failed to delete file: ${data.screenshotURL}`, error);
                    toast.error(`Failed to delete a file for deposit ${doc.id}. Skipping.`);
                }
            }
        }

        if (deletedCount > 0) {
            await batch.commit();
            toast.success(`Successfully cleaned up and deleted ${deletedCount} deposit screenshots.`, { id: toastId });
        } else {
            toast.info('No deposit screenshots needed to be deleted.', { id: toastId });
        }
    } catch (error: any) {
        toast.error('Deposit cleanup failed', { id: toastId, description: error.message });
    } finally {
        setIsDepositCleaning(false);
    }
  };

  const handleCleanupMatchWinnings = async () => {
    if (!firestore) return;
    if (!confirm('Are you sure you want to delete ALL screenshots from successful match winnings? This is permanent.')) return;

    setIsMatchWinningCleaning(true);
    const toastId = toast.loading('Starting cleanup of match winning screenshots...');
    try {
        const q = query(collection(firestore, 'matchWinnings'), where('status', '==', 'approved'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            toast.info("No approved match winnings found.", { id: toastId });
            return;
        }

        let deletedCount = 0;
        const batch = writeBatch(firestore);

        for (const doc of snapshot.docs) {
            const data = doc.data();
            if (data.screenshotUrl && data.screenshotUrl !== 'deleted') {
                try {
                    await deleteFileByUrl(data.screenshotUrl);
                    batch.update(doc.ref, { screenshotUrl: 'deleted' });
                    deletedCount++;
                } catch (error: any) {
                    console.error(`Failed to delete file: ${data.screenshotUrl}`, error);
                    toast.error(`Failed to delete file for match ${doc.id}. Skipping.`);
                }
            }
        }
        
        if (deletedCount > 0) {
            await batch.commit();
            toast.success(`Successfully cleaned up and deleted ${deletedCount} match winning screenshots.`, { id: toastId });
        } else {
            toast.info('No match winning screenshots needed to be deleted.', { id: toastId });
        }
    } catch (error: any) {
        toast.error('Match winning cleanup failed', { id: toastId, description: error.message });
    } finally {
        setIsMatchWinningCleaning(false);
    }
  };

  const handleCleanupOldProfilePictures = async () => {
    if (!firestore) return;
    if (!confirm('Are you sure you want to delete ALL user profile pictures? This does not delete default avatars. This is permanent.')) return;

    setIsProfileCleaning(true);
    const toastId = toast.loading('Starting cleanup of user profile pictures...');
    try {
        const usersSnapshot = await getDocs(collection(firestore, 'users'));
        
        if (usersSnapshot.empty) {
            toast.info("No users found.", { id: toastId });
            return;
        }

        let deletedCount = 0;
        const batch = writeBatch(firestore);

        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            // Check if photoURL exists and is a non-default, non-deleted URL
            if (userData.photoURL && !userData.photoURL.includes('googleusercontent') && !userData.photoURL.includes('robohash') && userData.photoURL !== 'deleted') {
                try {
                    await deleteFileByUrl(userData.photoURL);
                    batch.update(userDoc.ref, { photoURL: 'deleted' });
                    deletedCount++;
                } catch (error: any) {
                    console.error(`Failed to delete profile picture for user ${userDoc.id}:`, error);
                    toast.error(`Failed to delete photo for user ${userDoc.id}. It might have been already deleted.`);
                }
            }
        }

        if (deletedCount > 0) {
            await batch.commit();
            toast.success(`Successfully deleted ${deletedCount} old user profile pictures.`, { id: toastId });
        } else {
            toast.info('No old profile pictures found to delete.', { id: toastId });
        }

    } catch (error: any) {
        toast.error('Profile picture cleanup failed', { id: toastId, description: error.message });
    } finally {
        setIsProfileCleaning(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><HardDrive className="mr-2"/>Storage Bucket Management</CardTitle>
              <CardDescription>Analyze storage and clean up unnecessary files. Actions here are permanent.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button onClick={handleAnalyze} disabled={true} className="w-full sm:w-auto">
                    Analyze Bucket (Not Implemented)
                </Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><AlertTriangle className="mr-2 text-red-500"/>Cleanup Zone</CardTitle>
                <CardDescription>Bulk-delete files from your storage. Please be careful, these actions cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="destructive" onClick={handleCleanupSuccessfulDeposits} disabled={isDepositCleaning || !firestore}>
                    {isDepositCleaning ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                    Clean Deposit Screenshots
                </Button>
                <Button variant="destructive" onClick={handleCleanupMatchWinnings} disabled={isMatchWinningCleaning || !firestore}>
                    {isMatchWinningCleaning ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                    Clean Match Winning Screenshots
                </Button>
                 <Button variant="destructive" onClick={handleCleanupOldProfilePictures} disabled={isProfileCleaning || !firestore}>
                    {isProfileCleaning ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserX className="mr-2 h-4 w-4"/>}
                    Clean Old Profile Pictures
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
