'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useParams } from 'next/navigation';
import { useDoc, useFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const group = params.group as string;

  const { firestore, user, isUserLoading } = useFirebase();

  const groupRef = useMemo(() => firestore && group ? doc(firestore, 'groups', group) : null, [firestore, group]);
  const { data: groupData, isLoading: isGroupLoading } = useDoc(groupRef);

  const userDocRef = useMemo(() => firestore && user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userData, isLoading: isUserSubLoading } = useDoc(userDocRef);

  const isSubscribed = useMemo(() => {
    return !!(user && userData?.subscriptions?.includes(group));
  }, [user, userData, group]);

  if (isGroupLoading || isUserLoading || isUserSubLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  // Redirect if not subscribed or data is missing
  if (!isSubscribed) {
     router.push('/subscriptions');
     return <div className="p-4 text-center">Redirecting to subscriptions...</div>;
  }
  
  if (!groupData) {
    return (
      <div className="p-4 text-center">
        <p>Group not found.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            {groupData.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
            <>
              <p className="text-muted-foreground">Today's Lucky Number is:</p>
              <p className="text-6xl font-bold tracking-widest text-primary">{groupData.number || '??'}</p>
              <p className="text-sm text-muted-foreground pt-4">{groupData.number ? 'Result Declared: 10:00 AM' : 'Result Awaited'}</p>
            </>
        </CardContent>
      </Card>
      
       {groupData.pastResults && (
        <Card className="mt-6 bg-muted/30">
          <CardHeader>
            <CardTitle>Past Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-center text-muted-foreground">
              {groupData.pastResults.map((result: {date: string; number: string}) => (
                 <li key={result.date} className="flex justify-between items-center"><span>{result.date}:</span> <span className="font-mono text-lg text-foreground">{result.number}</span></li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
