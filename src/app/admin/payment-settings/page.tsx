
"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const PaymentSettingsPage = () => {
  const { firestore: db } = useFirebase();
  const [upiId, setUpiId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!db) return;
    const fetchUpiId = async () => {
      const docRef = doc(db, "settings", "payment");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUpiId(docSnap.data().upiId);
      }
    };
    fetchUpiId();
  }, [db]);

  const handleSave = async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      const docRef = doc(db, "settings", "payment");
      await setDoc(docRef, { upiId });
      toast.success("UPI ID saved successfully");
    } catch (error) {
      toast.error("Failed to save UPI ID");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <Card>
        <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
            <CardDescription>Configure the UPI ID where users will send deposit payments.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4 max-w-md">
            <div className="space-y-2">
                <Label htmlFor="upiId">
                Your UPI ID
                </Label>
                <Input
                id="upiId"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g., yourname@bank"
                />
            </div>
            <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
            </div>
        </CardContent>
        </Card>
    </div>
  );
};

export default PaymentSettingsPage;
