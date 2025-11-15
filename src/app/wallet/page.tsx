"use client";
import { useMemo } from "react";
import { doc } from "firebase/firestore";
import { useFirebase, useDoc } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from 'next/navigation';

const WalletPage = () => {
  const { user, firestore: db, isUserLoading } = useFirebase();
  const router = useRouter();

  const walletRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, "wallets", user.uid);
  }, [db, user]);

  const { data: walletData, isLoading: isWalletLoading } = useDoc(walletRef);

  const walletBalance = walletData?.balance ?? 0;
  
  if (isUserLoading) {
     return (
       <div className="flex justify-center items-center h-full">
         <Card className="w-full max-w-sm">
           <CardHeader className="text-center">
             <CardTitle>Your Wallet Balance</CardTitle>
           </CardHeader>
           <CardContent className="text-center space-y-6">
             <Skeleton className="h-10 w-3/4 mx-auto" />
             <Skeleton className="h-10 w-full" />
           </CardContent>
         </Card>
       </div>
    );
  }
  
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Your Wallet Balance</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
        {isWalletLoading && !walletData ? (
             <Skeleton className="h-10 w-3/4 mx-auto" />
        ) : (
          <p className="text-4xl font-bold mb-6">₹{walletBalance.toFixed(2)}</p>
        )}
          <Link href="/deposit">
            <Button className="w-full">Deposit Funds</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletPage;
