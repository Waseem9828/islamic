
'use client';

import { useState, useEffect, useMemo } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Settings } from 'lucide-react';

export default function SettingsPage() {
  const { firestore } = useFirebase();
  const [settings, setSettings] = useState({
    adminCommissionRate: 0.1,
    cancellationFee: 5,
    minEntryFee: 50,
    depositBonusRate: 0.05, 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const settingsRef = useMemo(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'rules');
  }, [firestore]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!settingsRef) {
        setIsLoading(false);
        return;
      };
      try {
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error('Failed to load settings.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [settingsRef]);

  const handleSave = async () => {
    if (!settingsRef) {
        toast.error('Firestore is not available.');
        return;
    }
    setIsSubmitting(true);
    try {
      await setDoc(settingsRef, settings, { merge: true });
      toast.success('Settings Updated', { description: 'All rules have been updated successfully.' });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error('Update Failed', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: parseFloat(value) }));
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Settings className="mr-2"/>App Rules & Commissions</CardTitle>
          <CardDescription>Manage the core financial rules of the application. Changes are effective immediately.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="font-medium">Admin Commission Rate (%)</label>
            <Input 
              type="number" 
              name="adminCommissionRate"
              value={settings.adminCommissionRate * 100} // Display as percentage
              onChange={(e) => setSettings(prev => ({...prev, adminCommissionRate: parseFloat(e.target.value) / 100}))}
              placeholder="e.g., 10 for 10%"
            />
            <p className="text-xs text-muted-foreground">The percentage of the total pot money taken as commission.</p>
          </div>

          <div className="space-y-2">
            <label className="font-medium">Match Cancellation Fee (₹)</label>
            <Input 
              type="number" 
              name="cancellationFee"
              value={settings.cancellationFee}
              onChange={handleInputChange}
              placeholder="e.g., 5"
            />
            <p className="text-xs text-muted-foreground">The fixed amount charged to a user for cancelling a match.</p>
          </div>

          <div className="space-y-2">
            <label className="font-medium">Minimum Match Entry Fee (₹)</label>
            <Input 
              type="number" 
              name="minEntryFee"
              value={settings.minEntryFee}
              onChange={handleInputChange}
              placeholder="e.g., 50"
            />
            <p className="text-xs text-muted-foreground">The minimum amount required to create a new match.</p>
          </div>

          <div className="space-y-2">
            <label className="font-medium">Deposit Bonus Rate (%)</label>
            <Input 
              type="number" 
              name="depositBonusRate"
              value={settings.depositBonusRate * 100} // Display as percentage
              onChange={(e) => setSettings(prev => ({...prev, depositBonusRate: parseFloat(e.target.value) / 100}))}
              placeholder="e.g., 5 for 5%"
            />
            <p className="text-xs text-muted-foreground">The percentage of the deposit amount given to the user as a bonus.</p>
          </div>
          
          <Button onClick={handleSave} disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            Save All Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
