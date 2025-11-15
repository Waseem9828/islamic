'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function ManageUsersPage() {
  const { firestore } = useFirebase();
  const usersQuery = useMemo(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users, isLoading } = useCollection(usersQuery);

  return (
    <div>
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
          <CardDescription>View and manage all registered users.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading users...</p>
          ) : (
            <div className="space-y-4">
              {users?.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-4">
                    <Avatar>
                        <AvatarImage src={user.photoURL || `https://avatar.vercel.sh/${user.email}.png`} />
                        <AvatarFallback>{user.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{user.username || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.id}</p>
                    </div>
                  </div>
                  <div>
                    {user.isAdmin && <Badge>Admin</Badge>}
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
