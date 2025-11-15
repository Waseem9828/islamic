"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const PaymentSettingsPage = () => {
  const { firestore: db } = useFirebase();
  const [upiId, setUpiId] = useState("");
  const { toast } = useToast();

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
    try {
      const docRef = doc(db, "settings", "payment");
      await setDoc(docRef, { upiId });
      toast({ title: "Success", description: "UPI ID saved successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save UPI ID",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="upiId" className="block text-sm font-medium mb-1">
              UPI ID
            </label>
            <Input
              id="upiId"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="Enter your UPI ID"
            />
          </div>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSettingsPage;
