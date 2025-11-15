'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useParams } from 'next/navigation';
import { getGroupData, isUserSubscribed } from '@/lib/store';

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const group = params.group as string;

  // Fetch data on every render to ensure it's always up-to-date
  const isSubscribed = isUserSubscribed(group);
  const groupData = getGroupData(group);

  const handleSubscribe = () => {
    router.push('/subscriptions');
  };

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
      
       {isSubscribed && (
        <Card className="mt-6 bg-muted/30">
          <CardHeader>
            <CardTitle>Past Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-center text-muted-foreground">
              {groupData.pastResults.map(result => (
                 <li key={result.date} className="flex justify-between items-center"><span>{result.date}:</span> <span className="font-mono text-lg text-foreground">{result.number}</span></li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
