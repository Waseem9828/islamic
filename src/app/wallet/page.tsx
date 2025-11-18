
"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, serverTimestamp, addDoc } from "firebase/firestore";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MIN_DEPOSIT_AMOUNT = 100;
const MIN_WALLET_BALANCE_FOR_WITHDRAWAL = 300;

const WalletPage = () => {
  const { user, isUserLoading: isAuthLoading, firestore: db, storage } = useFirebase();
  const router = useRouter();

  // State declarations
  const [upiId, setUpiId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [depositHistory, setDepositHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawUpiId, setWithdrawUpiId] = useState("");
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);
  const [isWithdrawalHistoryLoading, setIsWithdrawalHistoryLoading] = useState(true);

  const withdrawableBalance = Math.max(0, walletBalance - MIN_WALLET_BALANCE_FOR_WITHDRAWAL);

  // useEffect hooks...
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
  useEffect(() => { if (!db || !user) { setIsBalanceLoading(false); return; } const walletRef = doc(db, "wallets", user.uid); const unsubscribe = onSnapshot(walletRef, (doc) => { if (doc.exists()) { setWalletBalance(doc.data().balance || 0); } setIsBalanceLoading(false); }, (error) => { console.error("Error fetching wallet balance:", error); toast.error("Could not fetch wallet balance."); setIsBalanceLoading(false); }); return () => unsubscribe(); }, [db, user]);
  useEffect(() => { if (!db || !user) { setIsHistoryLoading(false); return; } const q = query(collection(db, "depositRequests"), where("userId", "==", user.uid), orderBy("createdAt", "desc")); const unsubscribe = onSnapshot(q, (snapshot) => { setDepositHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setIsHistoryLoading(false); }, (error) => { console.error("Error fetching deposit history:", error); setIsHistoryLoading(false); }); return () => unsubscribe(); }, [db, user]);
  useEffect(() => { if (!db || !user) { setIsWithdrawalHistoryLoading(false); return; } const q = query(collection(db, "withdrawalRequests"), where("userId", "==", user.uid), orderBy("createdAt", "desc")); const unsubscribe = onSnapshot(q, (snapshot) => { setWithdrawalHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setIsWithdrawalHistoryLoading(false); }, (error) => { console.error("Error fetching withdrawal history:", error); setIsWithdrawalHistoryLoading(false); }); return () => unsubscribe(); }, [db, user]);


  const handleDeposit = async () => {
    if (!user || !db || !storage) return toast.error("Cannot process request. Please refresh.");
    if (!depositAmount || !screenshot) return toast.error("Please enter an amount and upload a screenshot.");
    if (parseFloat(depositAmount) < MIN_DEPOSIT_AMOUNT) return toast.error(`Minimum deposit amount is ₹${MIN_DEPOSIT_AMOUNT}.`);

    setIsSubmittingDeposit(true);
    try {
      const storageRef = ref(storage, `deposit-screenshots/${user.uid}/${Date.now()}-${screenshot.name}`);
      const uploadTask = await uploadBytes(storageRef, screenshot);
      const screenshotUrl = await getDownloadURL(uploadTask.ref);

      const depositData = {
        userId: user.uid,
        amount: parseFloat(depositAmount),
        screenshotUrl: screenshotUrl,
        status: "pending",
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, "depositRequests"), depositData);

      toast.success("Deposit request submitted successfully!");
      setDepositAmount("");
      setScreenshot(null);
      const fileInput = document.getElementById('screenshot') as HTMLInputElement;
      if (fileInput) fileInput.value = "";

    } catch (error: any) {
      console.error("Error submitting deposit request:", error);
      toast.error("Failed to submit deposit request.", {
        description: error.message || "Please check your permissions or network and try again."
      });
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!user || !db) return toast.error("Cannot process request. Please refresh.");
    const amount = parseFloat(withdrawAmount);
    if (!withdrawAmount || !withdrawUpiId) return toast.error("Please enter an amount and your UPI ID.");
    if (amount <= 0) return toast.error("Invalid withdrawal amount.");
    if (amount > withdrawableBalance) return toast.error("Insufficient withdrawable balance.");

    setIsSubmittingWithdrawal(true);
    try {
        await addDoc(collection(db, "withdrawalRequests"), {
            userId: user.uid,
            amount: amount,
            upiId: withdrawUpiId,
            status: "pending",
            createdAt: serverTimestamp(),
        });
        toast.success("Withdrawal request submitted!");
        setWithdrawAmount("");
    } catch (error) {
        console.error("Error submitting withdrawal request:", error);
        toast.error("Failed to submit request.");
    } finally {
        setIsSubmittingWithdrawal(false);
    }
  };

  // JSX Rendering
  if (isAuthLoading) return <div className="container mx-auto max-w-2xl py-8"><Skeleton className="h-96 w-full" /></div>;
  if (!user) return <div className="container mx-auto max-w-lg py-8"><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You must be logged in.</CardDescription></CardHeader><CardContent><Button onClick={() => router.push('/login')} className="w-full">Login</Button></CardContent></Card></div>;

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card className="mb-4"><CardHeader className="flex flex-row items-center justify-between"><div><CardDescription>Wallet Balance</CardDescription>{isBalanceLoading ? <Skeleton className="h-8 w-32 mt-1" /> : <CardTitle className="text-3xl">₹{walletBalance.toFixed(2)}</CardTitle>}</div><div><CardDescription>Withdrawable</CardDescription>{isBalanceLoading ? <Skeleton className="h-8 w-24 mt-1" /> : <CardTitle className="text-2xl text-green-600">₹{withdrawableBalance.toFixed(2)}</CardTitle>}</div></CardHeader></Card>
      <Tabs defaultValue="deposit"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="deposit">Deposit</TabsTrigger><TabsTrigger value="withdraw">Withdraw</TabsTrigger></TabsList>
        <TabsContent value="deposit">
          <Card>
            <CardHeader><CardTitle>Create Deposit Request</CardTitle>{!upiId && !isSettingsLoading && <CardDescription className="text-destructive pt-2">Deposits are currently unavailable.</CardDescription>}</CardHeader>
            <CardContent className="space-y-4">
              {isSettingsLoading ? <Skeleton className="h-48 w-full" /> : (
                <>
                  <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder={`Amount (Min ₹${MIN_DEPOSIT_AMOUNT})`} disabled={!upiId || isSubmittingDeposit} />
                  {upiId && depositAmount && parseFloat(depositAmount) >= MIN_DEPOSIT_AMOUNT && (
                    <div className="flex flex-col items-center space-y-3 p-4 border rounded-md bg-muted/30"><p className="text-sm font-medium">Scan QR or use UPI App</p><QRCode value={`upi://pay?pa=${upiId}&am=${depositAmount}&cu=INR`} size={128} /><p className="text-xs text-muted-foreground">UPI ID: {upiId}</p><a href={`upi://pay?pa=${upiId}&am=${depositAmount}&cu=INR`} className="w-full"><Button className="w-full" disabled={isSubmittingDeposit}>Pay with UPI App</Button></a></div>
                  )}
                  <div><label htmlFor="screenshot" className="text-sm font-medium">Payment Screenshot</label><Input id="screenshot" type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files ? e.target.files[0] : null)} className="mt-1" disabled={!upiId || isSubmittingDeposit} /></div>
                  <Button onClick={handleDeposit} disabled={!depositAmount || !screenshot || !upiId || isSubmittingDeposit} className="w-full">{isSubmittingDeposit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Deposit</Button>
                </>
              )}
            </CardContent>
          </Card>
          <HistoryTable history={depositHistory} isLoading={isHistoryLoading} type="Deposit" />
        </TabsContent>
        <TabsContent value="withdraw">
          <Card>
            <CardHeader><CardTitle>Request Withdrawal</CardTitle><CardDescription>Request a withdrawal to your bank account. Minimum balance of ₹{MIN_WALLET_BALANCE_FOR_WITHDRAWAL} required.</CardDescription></CardHeader>
            <CardContent className="space-y-4"><Input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder={`Amount to withdraw (Max ₹${withdrawableBalance.toFixed(2)})`} disabled={isSubmittingWithdrawal || withdrawableBalance <= 0} /><Input value={withdrawUpiId} onChange={(e) => setWithdrawUpiId(e.target.value)} placeholder="Your UPI ID (e.g. you@bank)" disabled={isSubmittingWithdrawal || withdrawableBalance <= 0} /><Button onClick={handleWithdrawal} disabled={!withdrawAmount || !withdrawUpiId || isSubmittingWithdrawal || withdrawableBalance <= 0} className="w-full">{isSubmittingWithdrawal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Withdrawal Request</Button></CardContent>
          </Card>
          <HistoryTable history={withdrawalHistory} isLoading={isWithdrawalHistoryLoading} type="Withdrawal" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const HistoryTable = ({ history, isLoading, type }: { history: any[], isLoading: boolean, type: 'Deposit' | 'Withdrawal' }) => (
    <Card className="mt-4"><CardHeader><CardTitle>{type} History</CardTitle></CardHeader><CardContent>{isLoading ? <Skeleton className="h-24 w-full" /> : history.length > 0 ? (<Table><TableHeader><TableRow><TableHead>Amount</TableHead><TableHead>Status</TableHead>{type === 'Withdrawal' && <TableHead>UPI ID</TableHead>}<TableHead className="text-right">Date</TableHead></TableRow></TableHeader><TableBody>{history.map((item) => (<TableRow key={item.id}><TableCell className="font-medium">₹{item.amount.toFixed(2)}</TableCell><TableCell><Badge variant={item.status === 'approved' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'}>{item.status}</Badge></TableCell>{type === 'Withdrawal' && <TableCell>{item.upiId}</TableCell>}<TableCell className="text-right">{item.createdAt?.toDate().toLocaleDateString()}</TableCell></TableRow>))}</TableBody></Table>) : <p className="text-center text-muted-foreground py-4">You have no {type.toLowerCase()} history.</p>}</CardContent></Card>
)

export default WalletPage;
