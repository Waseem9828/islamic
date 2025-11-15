"use client";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useFirebase } from "@/firebase/provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const WalletPage = () => {
  const { user, firestore: db } = useFirebase();
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (!db || !user) return;
    const fetchWallet = async () => {
        const walletRef = doc(db, "wallets", user.uid);
        const walletSnap = await getDoc(walletRef);
        if (walletSnap.exists()) {
          setWalletBalance(walletSnap.data().balance);
        }
    };
    fetchWallet();
  }, [user, db]);

  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Your Wallet Balance</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-4xl font-bold mb-6">₹{walletBalance.toFixed(2)}</p>
          <Link href="/deposit">
            <Button className="w-full">Deposit Funds</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletPage;
