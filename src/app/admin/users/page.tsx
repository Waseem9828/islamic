'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck } from 'lucide-react';

export default function ManageUsersPage() {
  const { firestore } = useFirebase();
  const usersQuery = useMemo(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const { data: users, isLoading } = useCollection(usersQuery);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
          <CardDescription>View and manage all registered users in your application.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[150px]" />
                                <Skeleton className="h-3 w-[100px]" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          ) : (
            <div className="space-y-4">
              {users?.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <Avatar>
                        <AvatarImage src={user.photoURL || `https://avatar.vercel.sh/${user.email}.png`} alt={user.email || 'User'} />
                        <AvatarFallback>{user.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{user.displayName || user.email}</p>
                        <p className="text-sm text-muted-foreground font-mono">{user.id}</p>
                    </div>
                  </div>
                  <div>
                    {user.isAdmin && <Badge variant="destructive" className="flex items-center gap-1"><ShieldCheck className="h-3 w-3"/>Admin</Badge>}
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
