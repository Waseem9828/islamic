
"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useFirebase } from "@/firebase/provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
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

  useEffect(() => {
    if (!db || !user) {
      setIsHistoryLoading(false);
      return;
    }

    const historyQuery = query(
      collection(db, "depositRequests"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(historyData);
      setIsHistoryLoading(false);
    }, (error) => {
      console.error("Error fetching deposit history:", error);
      toast.error("Could not fetch deposit history.");
      setIsHistoryLoading(false);
    });

    return () => unsubscribe();
  }, [db, user]);

  const handleDeposit = async () => {
    if (!user || !db || !storage) {
      toast.error("Cannot process request. Please refresh and try again.");
      return;
    }
    if (!amount || !screenshot) {
      toast.error("Please enter an amount and upload a screenshot.");
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
        createdAt: new Date(),
      };

      addDocumentNonBlocking(collection(db, "depositRequests"), newRequest);

      toast.success("Deposit request submitted successfully!");
      setAmount("");
      setScreenshot(null);
      const fileInput = document.getElementById('screenshot') as HTMLInputElement;
      if (fileInput) fileInput.value = "";

    } catch (error) {
      console.error("Error submitting deposit request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="container mx-auto max-w-2xl py-8 space-y-8">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-lg py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You must be logged in to view this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/login')} className="w-full">Login</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Deposit Request</CardTitle>
          {!upiId && !isSettingsLoading && <CardDescription className="text-destructive pt-2">Deposits are currently unavailable as the admin has not set up payment details.</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          {isSettingsLoading ? <Skeleton className="h-48 w-full" /> : (
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
                  <p className="text-sm font-medium">Scan QR to pay or use the button below</p>
                  <QRCode value={`upi://pay?pa=${upiId}&am=${amount}&cu=INR`} size={128} />
                  <p className="text-xs text-muted-foreground">UPI ID: {upiId}</p>
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
                <p className="text-xs text-muted-foreground mt-1">Upload screenshot after successful payment.</p>
              </div>
              <Button onClick={handleDeposit} disabled={!amount || !screenshot || !upiId || isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Deposit Request
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deposit History</CardTitle>
          <CardDescription>Here is a list of your recent deposit requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {isHistoryLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : history.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">₹{item.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        item.status === 'approved' ? 'success' :
                        item.status === 'rejected' ? 'destructive' :
                        'secondary'
                      }>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.createdAt?.toDate().toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>You have no deposit history.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositPage;
