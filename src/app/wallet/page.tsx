"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth, useFirebase } from "@/firebase/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode.react";

const WalletPage = () => {
  const { user } = useAuth();
  const { firestore: db, storage } = useFirebase();
  const [upiId, setUpiId] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!db || !user) return;
    const fetchWalletAndUpi = async () => {
        const walletRef = doc(db, "wallets", user.uid);
        const walletSnap = await getDoc(walletRef);
        if (walletSnap.exists()) {
          setWalletBalance(walletSnap.data().balance);
        }

        const upiRef = doc(db, "settings", "payment");
        const upiSnap = await getDoc(upiRef);
        if (upiSnap.exists()) {
          setUpiId(upiSnap.data().upiId);
        }
    };
    fetchWalletAndUpi();
  }, [user, db]);

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

      toast({ title: "Success", description: "Deposit request submitted" });
      setAmount("");
      setScreenshot(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit deposit request",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Your Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">₹{walletBalance.toFixed(2)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Add Funds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {upiId && (
            <div className="flex flex-col items-center space-y-2">
              <QRCode value={`upi://pay?pa=${upiId}&am=${amount || '1'}&cu=INR`} />
              <p>Scan to pay or</p>
              <a href={`upi://pay?pa=${upiId}&am=${amount || '1'}&cu=INR`}>
                <Button>Pay with UPI</Button>
              </a>
            </div>
          )}
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount to add"
          />
          <Input
            type="file"
            onChange={(e) => setScreenshot(e.target.files ? e.target.files[0] : null)}
          />
          <Button onClick={handleDeposit} disabled={!amount || !screenshot}>
            Submit Deposit Request
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletPage;
