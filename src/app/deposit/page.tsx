
"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth, useFirebase } from "@/firebase/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode.react";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

const DepositPage = () => {
  const { user } = useAuth();
  const { firestore: db, storage } = useFirebase();
  const [upiId, setUpiId] = useState("");
  const [amount, setAmount] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) return;
    const fetchUpiId = async () => {
      setIsSettingsLoading(true);
      const upiRef = doc(db, "settings", "payment");
      try {
        const upiSnap = await getDoc(upiRef);
        if (upiSnap.exists()) {
          setUpiId(upiSnap.data().upiId);
        }
      } catch (error) {
        console.error("Error fetching UPI ID:", error);
        toast({
          title: "Error",
          description: "Could not fetch payment settings.",
          variant: "destructive",
        });
      } finally {
        setIsSettingsLoading(false);
      }
    };
    fetchUpiId();
  }, [db, toast]);

  const handleDeposit = async () => {
    if (!amount || !screenshot || !user || !db || !storage) {
        toast({
            title: "Missing Information",
            description: "Please fill out all fields and upload a screenshot.",
            variant: "destructive"
        });
        return;
    }

    setIsSubmitting(true);

    try {
      const storageRef = ref(storage, `deposit-screenshots/${user.uid}/${Date.now()}-${screenshot.name}`);
      await uploadBytes(storageRef, screenshot);
      const screenshotUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, "depositRequests"), {
        userId: user.uid,
        amount: parseFloat(amount),
        screenshotUrl,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      toast({ title: "Success", description: "Deposit request submitted successfully. It will be reviewed by an admin." });
      setAmount("");
      setScreenshot(null);
      // Reset file input
      const fileInput = document.getElementById('screenshot') as HTMLInputElement;
      if (fileInput) fileInput.value = "";

    } catch (error) {
      console.error("Error submitting deposit request:", error);
      toast({
        title: "Error",
        description: "Failed to submit deposit request. Please try again.",
        variant: "destructive",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isSettingsLoading) {
      return (
          <div className="flex justify-center items-center h-full p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Create Deposit Request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
          </div>
      )
  }

  return (
    <div className="flex justify-center items-start h-full p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Deposit Request</CardTitle>
           {!upiId && <CardDescription className="text-destructive pt-2">Deposits are currently unavailable. The admin has not configured payment settings.</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount to deposit (INR)"
            disabled={!upiId || isSubmitting}
          />
          {upiId && amount && (
            <div className="flex flex-col items-center space-y-3 p-4 border rounded-md bg-muted/30">
              <p className="text-sm font-medium">Scan the QR code to pay</p>
              <QRCode value={`upi://pay?pa=${upiId}&am=${amount}&cu=INR`} size={128} />
              <p className="text-xs text-muted-foreground">or pay to UPI ID:</p>
              <p className="font-semibold">{upiId}</p>
              <a href={`upi://pay?pa=${upiId}&am=${amount}&cu=INR`} className="w-full">
                <Button className="w-full" disabled={isSubmitting}>Pay with UPI App</Button>
              </a>
            </div>
          )}
          <div>
            <label htmlFor="screenshot" className="text-sm font-medium">Payment Screenshot</label>
            <Input
              id="screenshot"
              type="file"
              accept="image/*"
              onChange={(e) => setScreenshot(e.target.files ? e.target.files[0] : null)}
              className="mt-1"
              disabled={!upiId || isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">After payment, upload the screenshot here.</p>
          </div>
          <Button onClick={handleDeposit} disabled={!amount || !screenshot || !upiId || isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Submitting...' : 'Submit Deposit Request'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositPage;
