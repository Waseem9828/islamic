'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useCollection, useFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const groupsQuery = useMemo(() => firestore ? collection(firestore, 'groups') : null, [firestore]);
  const { data: groups, isLoading } = useCollection(groupsQuery);

  const handleGroupClick = (groupId: string) => {
    router.push(`/${groupId}`);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
         <h1 className="text-3xl font-bold mb-4 text-center tracking-wider">Dashboard</h1>
         <Skeleton className="h-32 w-full rounded-lg" />
         <Skeleton className="h-32 w-full rounded-lg" />
         <Skeleton className="h-32 w-full rounded-lg" />
         <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6 text-center tracking-wider">Dashboard</h1>
      <div className="space-y-4">
        {groups?.map((group) => (
          <Card
            key={group.id}
            className="cursor-pointer transition-all duration-300 active:scale-[0.98] bg-muted/20 border-border/50 hover:border-primary/50"
            onClick={() => handleGroupClick(group.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className='flex flex-col'>
                    <p className="text-2xl font-bold text-primary">{group.name}</p>
                    <p className="text-xs text-muted-foreground">Updated Today</p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 h-20 w-28 bg-background/50 rounded-lg border border-dashed border-primary/50">
                    <p className="text-3xl font-mono font-bold tracking-widest text-primary/90">{group.number || '??'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!groups || groups.length === 0) && (
            <div className="text-center text-muted-foreground pt-10">
                <p>No groups available yet.</p>
                <p className="text-sm">Please check back later.</p>
            </div>
        )}
      </div>
    </div>
  );
}
