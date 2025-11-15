'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

export default function ManageSubscriptionsPage() {
  const { firestore } = useFirebase();
  const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users, isLoading } = useCollection(usersQuery);

  return (
    <div>
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>Manage Subscriptions</CardTitle>
          <CardDescription>View all active user subscriptions.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading subscriptions...</p>
          ) : (
            <div className="space-y-4">
              {users?.filter(u => u.subscriptions && u.subscriptions.length > 0).map(user => (
                <div key={user.id} className="p-4 rounded-lg bg-muted/50">
                  <p className="font-semibold">{user.email}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user.subscriptions.map((sub: string) => (
                      <Badge key={sub} variant="secondary">{sub}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
