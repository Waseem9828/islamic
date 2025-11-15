"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

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
  const { toast } = useToast();

  const fetchRequests = async () => {
    if (!db) return;
    const querySnapshot = await getDocs(collection(db, "depositRequests"));
    const requestsData = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as DepositRequest)
    );
    setRequests(requestsData.filter((req) => req.status === "pending"));
  };

  useEffect(() => {
    fetchRequests();
  }, [db]);

  const handleApprove = async (request: DepositRequest) => {
    if (!db) return;
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
        await setDoc(walletRef, { balance: request.amount });
      }

      toast({ title: "Success", description: "Deposit approved" });
      fetchRequests(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve deposit",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit Requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request) => (
          <div key={request.id} className="flex items-center justify-between p-2 border rounded">
            <div>
              <p>User ID: {request.userId}</p>
              <p>Amount: ₹{request.amount}</p>
            </div>
            <div className="w-24 h-24 relative">
              <Image
                src={request.screenshotUrl}
                alt="Screenshot"
                layout="fill"
                objectFit="cover"
              />
            </div>
            <Button onClick={() => handleApprove(request)}>Approve</Button>
          </div>
        ))}
        {requests.length === 0 && <p>No pending deposit requests.</p>}
      </CardContent>
    </Card>
  );
};

export default DepositRequestsPage;
