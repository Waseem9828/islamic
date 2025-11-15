'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useCollection, useDoc, useFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  const { firestore, user, isUserLoading } = useFirebase();
  
  const groupsQuery = useMemo(() => firestore ? collection(firestore, 'groups') : null, [firestore]);
  const { data: groups, isLoading: isGroupsLoading } = useCollection(groupsQuery);
  
  const userDocRef = useMemo(() => firestore && user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userData, isLoading: isUserDocLoading } = useDoc(userDocRef);

  const handleGroupClick = (isSubscribed: boolean, groupId: string) => {
    if (isSubscribed) {
      router.push(`/${groupId}`);
    }
  };

  const isLoading = isGroupsLoading || isUserLoading || isUserDocLoading;

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
        {groups?.map((group) => {
          const isSubscribed = !!user && !!userData?.subscriptions?.includes(group.id);

          return (
            <Card
              key={group.id}
              className={`transition-all duration-300 bg-muted/20 border-border/50 ${isSubscribed ? 'cursor-pointer hover:border-primary/50 active:scale-[0.98]' : ''} overflow-hidden`}
              onClick={() => handleGroupClick(isSubscribed, group.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className='flex flex-col'>
                      <p className="text-2xl font-bold text-primary">{group.name}</p>
                      <p className="text-xs text-muted-foreground">{group.number ? 'Updated Today' : 'Result Awaited'}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 h-20 w-28 bg-background/50 rounded-lg border border-dashed border-primary/50">
                    {isSubscribed ? (
                      <p className="text-3xl font-mono font-bold tracking-widest text-primary/90">{group.number || '??'}</p>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); router.push('/subscriptions'); }}>
                        Subscribe
                      </Button>
                    )}
                  </div>
                </div>
                 {isSubscribed && group.pastResults && group.pastResults.length > 0 && (
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
          );
        })}

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
