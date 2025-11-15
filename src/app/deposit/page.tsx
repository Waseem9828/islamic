
"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useFirebase } from "@/firebase/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import QRCode from "qrcode.react";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { addDocumentNonBlocking } from "@/firebase";

const DepositPage = () => {
  const { user, isUserLoading: isAuthLoading } = useFirebase();
  const { firestore: db, storage } = useFirebase();
  const [upiId, setUpiId] = useState("");
  const [amount, setAmount] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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
        toast.error("Could not fetch payment settings.");
      } finally {
        setIsSettingsLoading(false);
      }
    };
    fetchUpiId();
  }, [db]);

  const handleDeposit = async () => {
    if (!user) {
        toast.error("You must be logged in to make a deposit.");
        return;
    }
    if (!amount || !screenshot) {
        toast.error("Please fill out all fields and upload a screenshot.");
        return;
    }
    if (!db || !storage) {
        toast.error("Could not connect to the database. Please try again later.");
        return;
    }

    setIsSubmitting(true);

    try {
      const storageRef = ref(storage, `deposit-screenshots/${user.uid}/${Date.now()}-${screenshot.name}`);
      await uploadBytes(storageRef, screenshot);
      const screenshotUrl = await getDownloadURL(storageRef);

      const newRequest = {
        userId: user.uid,
        amount: parseFloat(amount),
        screenshotUrl,
        status: "pending",
        createdAt: new Date(), // Using client-side date for now
      };

      // Use the non-blocking function
      addDocumentNonBlocking(collection(db, "depositRequests"), newRequest);

      // Optimistic UI update
      toast.success("Deposit request submitted! It will be reviewed by an admin.");
      setAmount("");
      setScreenshot(null);
      const fileInput = document.getElementById('screenshot') as HTMLInputElement;
      if (fileInput) fileInput.value = "";

    } catch (error) {
      console.error("Error during deposit process:", error);
      toast.error("Failed to submit deposit request. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (isAuthLoading || isSettingsLoading) {
      return (
          <div className="flex justify-center items-start h-full p-4">
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

  if (!user) {
    return (
        <div className="flex justify-center items-start h-full p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create Deposit Request</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Please log in to create a deposit request.</p>
                <Button onClick={() => router.push('/login')} className="w-full mt-4">Login</Button>
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
           {!upiId && !isSettingsLoading && <CardDescription className="text-destructive pt-2">Deposits are currently unavailable. The admin has not configured payment settings.</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
           {isSettingsLoading ? <Skeleton className="h-10 w-full" /> : (
            <>
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
              <Button onClick={handleDeposit} disabled={!amount || !screenshot || !upiId || isSubmitting || !user} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Submitting...' : 'Submit Deposit Request'}
              </Button>
            </>
           )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositPage;
