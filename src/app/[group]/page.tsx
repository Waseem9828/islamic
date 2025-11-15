'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useParams } from 'next/navigation';
import { useDoc, useUser, useFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const group = params.group as string;

  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const groupRef = doc(firestore, 'groups', group);
  const { data: groupData, isLoading: isGroupLoading } = useDoc(groupRef);

  const userSubscriptionsRef = user ? doc(firestore, 'users', user.uid) : null;
  const { data: userData, isLoading: isUserSubLoading } = useDoc(userSubscriptionsRef);

  const isSubscribed = userData?.subscriptions?.includes(group);

  const handleSubscribe = () => {
    router.push('/subscriptions');
  };

  if (isGroupLoading || isUserLoading || isUserSubLoading) {
    return <div className="p-4 text-center">Loading...</div>;
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
          {isSubscribed ? (
            <>
              <p className="text-muted-foreground">Today's Lucky Number is:</p>
              <p className="text-6xl font-bold tracking-widest text-primary">{groupData.number}</p>
              <p className="text-sm text-muted-foreground pt-4">Result Declared: 10:00 AM</p>
            </>
          ) : (
            <>
              <p className="text-center text-muted-foreground">
                Your subscription is not active for this group.
              </p>
              <Button onClick={handleSubscribe}>Subscribe Now</Button>
            </>
          )}
        </CardContent>
      </Card>
      
       {isSubscribed && groupData.pastResults && (
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
