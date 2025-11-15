"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth, useFirebase } from "@/firebase/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode.react";

const DepositPage = () => {
  const { user } = useAuth();
  const { firestore: db, storage } = useFirebase();
  const [upiId, setUpiId] = useState("");
  const [amount, setAmount] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!db) return;
    const fetchUpiId = async () => {
      const upiRef = doc(db, "settings", "payment");
      const upiSnap = await getDoc(upiRef);
      if (upiSnap.exists()) {
        setUpiId(upiSnap.data().upiId);
      }
    };
    fetchUpiId();
  }, [db]);

  const handleDeposit = async () => {
    if (!amount || !screenshot || !user || !db || !storage) return;

    try {
      const storageRef = ref(storage, `deposit-screenshots/${user.uid}/${Date.now()}`);
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
    } catch (error) {
      console.error("Error submitting deposit request:", error);
      toast({
        title: "Error",
        description: "Failed to submit deposit request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Deposit Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount to deposit (INR)"
          />
          {upiId && amount && (
            <div className="flex flex-col items-center space-y-3 p-4 border rounded-md">
              <p className="text-sm font-medium">Scan the QR code to pay</p>
              <QRCode value={`upi://pay?pa=${upiId}&am=${amount}&cu=INR`} size={128} />
              <p className="text-xs text-muted-foreground">or pay to UPI ID:</p>
              <p className="font-semibold">{upiId}</p>
              <a href={`upi://pay?pa=${upiId}&am=${amount}&cu=INR`} className="w-full">
                <Button className="w-full">Pay with UPI</Button>
              </a>
            </div>
          )}
          <div>
            <label htmlFor="screenshot" className="text-sm font-medium">Payment Screenshot</label>
            <Input
              id="screenshot"
              type="file"
              onChange={(e) => setScreenshot(e.target.files ? e.target.files[0] : null)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">After payment, upload the screenshot here.</p>
          </div>
          <Button onClick={handleDeposit} disabled={!amount || !screenshot || !upiId} className="w-full">
            Submit Deposit Request
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositPage;
