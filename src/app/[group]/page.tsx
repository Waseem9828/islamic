'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useParams } from 'next/navigation';

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const group = params.group as string;

  const groupName = group.charAt(0).toUpperCase() + group.slice(1);

  const handleSubscribe = () => {
    router.push('/subscriptions');
  };

  const isSubscribed = false; // Placeholder for subscription logic

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            {groupName}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
          {isSubscribed ? (
            <>
              <p className="text-muted-foreground">Today's Lucky Number is:</p>
              <p className="text-6xl font-bold tracking-widest">77</p>
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
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Past Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-center text-muted-foreground">
              <li className="flex justify-between"><span>Yesterday:</span> <span>45</span></li>
              <li className="flex justify-between"><span>Day before:</span> <span>81</span></li>
              <li className="flex justify-between"><span>2 days ago:</span> <span>23</span></li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
