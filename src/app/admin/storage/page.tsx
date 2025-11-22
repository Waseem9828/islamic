'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Trash2, HardDrive, FileText, AlertTriangle } from 'lucide-react';
import { collection, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { useFirebase } from '@/firebase';

export default function ManageStoragePage() {
  const { firestore } = useFirebase();
  const [bucketName, setBucketName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{ totalSize: string, fileCount: number } | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const handleAnalyze = async () => {
    if (!bucketName) {
      toast.error('Please enter your Google Cloud Storage bucket name.');
      return;
    }
    setIsLoading(true);
    setAnalysis(null);
    setFiles([]);
    try {
      // This is a placeholder. In a real scenario, you would have a backend endpoint to run this command.
      // For now, we'll simulate the output.
      // const response = await runGsutilCommand(`du -sh gs://${bucketName}`);
      // const fileList = await runGsutilCommand(`ls gs://${bucketName}`);
      toast.info('Simulating storage analysis...');
      setTimeout(() => {
          setAnalysis({ totalSize: '1.2 GB', fileCount: 1234 });
          setFiles([
              `gs://${bucketName}/deposits/deposit_abc123.jpg`,
              `gs://${bucketName}/deposits/deposit_def456.png`,
              `gs://${bucketName}/other/some_other_file.pdf`,
          ]);
          setIsLoading(false);
      }, 2000)
    } catch (error: any) {
      toast.error('Analysis Failed', { description: error.message });
      setIsLoading(false);
    }
  };
  
  const handleDeleteFile = async (filePath: string) => {
    if (!confirm(`Are you sure you want to delete this file: ${filePath}? This action cannot be undone.`)) return;

    setIsDeleting(true);
    try {
        // This is a placeholder for the actual delete operation
        toast.info(`Simulating deletion of ${filePath}...`);
        setTimeout(() => {
            setFiles(prevFiles => prevFiles.filter(f => f !== filePath));
            toast.success('File deleted successfully!');
            setIsDeleting(false);
        }, 1000);
    } catch (error: any) {
        toast.error('Delete Failed', { description: error.message });
        setIsDeleting(false);
    }
  }

  const handleCleanupSuccessfulDeposits = async () => {
    if (!firestore) return;
    if (!confirm('Are you sure you want to delete ALL screenshots from successful deposits? This is a permanent action.')) return;

    setIsCleaning(true);
    try {
        const q = query(collection(firestore, 'depositRequests'), where('status', '==', 'approved'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            toast.info("No successful deposits found to clean up.");
            setIsCleaning(false);
            return;
        }

        // In a real scenario, you'd get the file paths and delete them from storage.
        // For now, we just count them and simulate.
        const count = snapshot.size;
        toast.info(`Simulating the deletion of ${count} deposit screenshots...`);

        // You could also update the documents to remove the screenshotURL
        const batch = writeBatch(firestore);
        snapshot.docs.forEach(doc => {
            // Here you could update the document, e.g., set screenshotURL to null
        });
        // await batch.commit();

        setTimeout(() => {
            toast.success(`Successfully cleaned up ${count} deposit files.`);
            setIsCleaning(false);
        }, 2500);

    } catch (error: any) {
        toast.error('Cleanup Failed', { description: error.message });
        setIsCleaning(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><HardDrive className="mr-2"/>Storage Bucket Management</CardTitle>
              <CardDescription>Analyze your Google Cloud Storage usage and clean up unnecessary files.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                    <Input 
                        placeholder="Enter your storage bucket name (e.g., my-app.appspot.com)" 
                        value={bucketName} 
                        onChange={e => setBucketName(e.target.value)} 
                    />
                    <Button onClick={handleAnalyze} disabled={isLoading} className="w-full sm:w-auto">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Analyze Bucket
                    </Button>
                </div>
            </CardContent>
        </Card>

        {analysis && (
            <Card>
                <CardHeader>
                    <CardTitle>Analysis Result</CardTitle>
                    <CardDescription>Summary of your storage usage.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-muted rounded-lg">Total Storage Used: <span className="font-bold">{analysis.totalSize}</span></div>
                    <div className="p-4 bg-muted rounded-lg">Total Files: <span className="font-bold">{analysis.fileCount}</span></div>
                </CardContent>
            </Card>
        )}

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><AlertTriangle className="mr-2 text-red-500"/>Cleanup Zone</CardTitle>
                <CardDescription>Here you can perform dangerous actions like bulk-deleting files. Please be careful.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="destructive" onClick={handleCleanupSuccessfulDeposits} disabled={isCleaning || !firestore}>
                    {isCleaning ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                    Delete All Successful Deposit Screenshots
                </Button>
            </CardContent>
        </Card>

        {files.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>File Browser</CardTitle>
                    <CardDescription>A list of files found in your bucket. You can delete them one by one.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {files.map(file => (
                        <div key={file} className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                            <span className="font-mono flex items-center"><FileText className="h-4 w-4 mr-2"/>{file}</span>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteFile(file)} disabled={isDeleting}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )}
    </div>
  );
}
