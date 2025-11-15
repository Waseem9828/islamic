'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useCollection, useFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

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
         <Skeleton className="h-48 w-full rounded-lg" />
         <Skeleton className="h-48 w-full rounded-lg" />
         <Skeleton className="h-48 w-full rounded-lg" />
         <Skeleton className="h-48 w-full rounded-lg" />
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
            className="cursor-pointer transition-all duration-300 active:scale-[0.98] bg-muted/20 border-border/50 hover:border-primary/50 overflow-hidden"
            onClick={() => handleGroupClick(group.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className='flex flex-col'>
                    <p className="text-2xl font-bold text-primary">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.number ? 'Updated Today' : 'Result Awaited'}</p>
                </div>
                <div className="flex flex-col items-center justify-center p-4 h-20 w-28 bg-background/50 rounded-lg border border-dashed border-primary/50">
                    <p className="text-3xl font-mono font-bold tracking-widest text-primary/90">{group.number || '??'}</p>
                </div>
              </div>
               {group.pastResults && group.pastResults.length > 0 && (
                <>
                  <Separator className="my-3 bg-border/40" />
                  <div className="px-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Past Results</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {group.pastResults.slice(0, 3).map((result: {date: string; number: string}) => (
                         <li key={result.date} className="flex justify-between items-center text-xs">
                            <span>{result.date}:</span> 
                            <span className="font-mono text-foreground tracking-widest">{result.number}</span>
                         </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
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
