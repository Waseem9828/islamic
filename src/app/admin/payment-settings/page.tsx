
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { DollarSign, Percent, ArrowRight, Loader2, Settings, QrCode } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface DepositSettings {
    upiId: string;
    qrCodeUrl: string;
    minDeposit: number;
    maxDeposit: number;
    bonusEnabled: boolean;
    bonusPercentage: number;
    maxBonus: number;
    minDepositForBonus: number;
}

export default function PaymentSettingsPage() {
  const { firestore } = useFirebase();
  const [settings, setSettings] = useState<Partial<DepositSettings>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    setIsFetching(true);
    const docRef = doc(firestore, 'settings', 'payment');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        // set with some defaults if it doesn't exist
        setSettings({
            upiId: '',
            qrCodeUrl: '',
            minDeposit: 10,
            maxDeposit: 10000,
            bonusEnabled: true,
            bonusPercentage: 10,
            maxBonus: 100,
            minDepositForBonus: 50
        });
      }
      setIsFetching(false);
    }, (error) => {
        console.error("Failed to fetch settings:", error);
        toast.error("Failed to load settings.");
        setIsFetching(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const handleSave = async () => {
    if (!firestore) return;
    setIsLoading(true);
    try {
      const docRef = doc(firestore, 'settings', 'payment');
      await setDoc(docRef, settings, { merge: true });
      toast.success('Payment settings saved successfully!');
    } catch (error: any) {
      toast.error('Failed to save settings', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type, checked } = e.target;
      if (type === 'checkbox') {
          setSettings(prev => ({ ...prev, [name]: checked }));
      } else {
          setSettings(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
      }
  };

  if (isFetching) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  return (
    <div className="mx-auto max-w-4xl">
        <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><Settings className="mr-2"/>Deposit Configuration</CardTitle>
            <CardDescription>Manage payment methods, deposit limits, and bonus offers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="space-y-4">
                 <h3 className="font-semibold text-lg flex items-center"><QrCode className='mr-2'/> Payment Methods</h3>
                <div className="space-y-2">
                    <Label htmlFor="upiId">Your UPI ID</Label>
                    <Input id="upiId" name="upiId" value={settings.upiId || ''} onChange={handleInputChange} placeholder="e.g., yourname@bank" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="qrCodeUrl">UPI QR Code Image URL</Label>
                    <Input id="qrCodeUrl" name="qrCodeUrl" value={settings.qrCodeUrl || ''} onChange={handleInputChange} placeholder="https://example.com/qr.png" />
                </div>
            </div>

            <div className="space-y-4">
                 <h3 className="font-semibold text-lg flex items-center"><DollarSign className='mr-2'/> Deposit Limits</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="minDeposit">Minimum Deposit</Label>
                        <Input id="minDeposit" name="minDeposit" type="number" value={settings.minDeposit || 0} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="maxDeposit">Maximum Deposit</Label>
                        <Input id="maxDeposit" name="maxDeposit" type="number" value={settings.maxDeposit || 10000} onChange={handleInputChange} />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center"><Percent className='mr-2'/> Deposit Bonus</h3>
                <div className="flex items-center space-x-2">
                    <Switch id="bonusEnabled" name="bonusEnabled" checked={settings.bonusEnabled} onCheckedChange={(checked) => setSettings(prev => ({...prev, bonusEnabled: checked}))} />
                    <Label htmlFor="bonusEnabled">Enable deposit bonus</Label>
                </div>
                 {settings.bonusEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                         <div className="space-y-2">
                            <Label htmlFor="bonusPercentage">Bonus %</Label>
                            <Input id="bonusPercentage" name="bonusPercentage" type="number" value={settings.bonusPercentage || 0} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxBonus">Max Bonus Amount</Label>
                            <Input id="maxBonus" name="maxBonus" type="number" value={settings.maxBonus || 0} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="minDepositForBonus">Min Deposit for Bonus</Label>
                            <Input id="minDepositForBonus" name="minDepositForBonus" type="number" value={settings.minDepositForBonus || 0} onChange={handleInputChange} />
                        </div>
                    </div>
                 )}
            </div>
            
            <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? <><Loader2 className='mr-2 h-4 w-4 animate-spin'/> Saving...</> : 'Save All Settings'}
            </Button>
        </CardContent>
        </Card>
    </div>
  );
}
