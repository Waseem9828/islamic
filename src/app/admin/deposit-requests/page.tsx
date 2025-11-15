
"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, setDoc, getDoc, query, where } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface DepositRequest {
  id: string;
  userId: string;
  amount: number;
  screenshotUrl: string;
  status: string;
}

const DepositRequestsPage = () => {
  const { firestore: db } = useFirebase();
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRequests = async () => {
    if (!db) return;
    setIsLoading(true);
    try {
        const q = query(collection(db, "depositRequests"), where("status", "==", "pending"));
        const querySnapshot = await getDocs(q);
        const requestsData = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as DepositRequest)
        );
        setRequests(requestsData);
    } catch (error) {
        console.error("Error fetching deposit requests:", error);
        toast({
            title: "Error",
            description: "Failed to fetch deposit requests.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [db]);

  const handleApprove = async (request: DepositRequest) => {
    if (!db) return;
    setApprovingId(request.id);
    try {
      const requestRef = doc(db, "depositRequests", request.id);
      await updateDoc(requestRef, { status: "approved" });

      const walletRef = doc(db, "wallets", request.userId);
      const walletSnap = await getDoc(walletRef);

      if (walletSnap.exists()) {
        const currentBalance = walletSnap.data().balance || 0;
        await updateDoc(walletRef, {
          balance: currentBalance + request.amount,
        });
      } else {
        await setDoc(walletRef, { balance: request.amount, userId: request.userId });
      }

      toast({ title: "Success", description: "Deposit approved and wallet updated." });
      // Refresh the list by filtering out the approved request
      setRequests(prev => prev.filter(r => r.id !== request.id));
    } catch (error) {
      console.error("Error approving deposit:", error);
      toast({
        title: "Error",
        description: "Failed to approve deposit. Please try again.",
        variant: "destructive",
      });
    } finally {
        setApprovingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit Requests</CardTitle>
        <CardDescription>Review and approve pending user deposit requests.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <div className="flex items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin" /></div>}
        
        {!isLoading && requests.map((request) => (
          <div key={request.id} className="flex flex-col sm:flex-row items-center justify-between p-3 border rounded-lg gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold">User ID:</p>
              <p className="text-xs text-muted-foreground break-all">{request.userId}</p>
              <p className="text-sm font-semibold mt-2">Amount:</p>
              <p className="font-bold text-lg">₹{request.amount}</p>
            </div>
            
            <Dialog>
                <DialogTrigger asChild>
                    <div className="w-24 h-24 relative cursor-pointer rounded-md overflow-hidden border">
                      <Image
                        src={request.screenshotUrl}
                        alt="Screenshot"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                </DialogTrigger>
                <DialogContent className="max-w-lg w-full">
                    <DialogHeader>
                        <DialogTitle>Deposit Screenshot</DialogTitle>
                    </DialogHeader>
                    <div className="relative aspect-video">
                         <Image
                            src={request.screenshotUrl}
                            alt="Screenshot full view"
                            fill
                            className="object-contain"
                          />
                    </div>
                </DialogContent>
            </Dialog>

            <Button onClick={() => handleApprove(request)} disabled={approvingId === request.id}>
              {approvingId === request.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {approvingId === request.id ? 'Approving...' : 'Approve'}
            </Button>
          </div>
        ))}
        {!isLoading && requests.length === 0 && <p className="text-center text-muted-foreground py-8">No pending deposit requests.</p>}
      </CardContent>
    </Card>
  );
};

export default DepositRequestsPage;
