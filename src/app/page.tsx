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
    <div className="p-2 sm:p-4">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center tracking-wide">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups?.map((group) => {
          const isSubscribed = !!user && !!userData?.subscriptions?.includes(group.id);

          return (
            <Card
              key={group.id}
              className={`transition-all duration-300 bg-card shadow-sm hover:shadow-md ${isSubscribed ? 'cursor-pointer active:scale-[0.98]' : ''} overflow-hidden`}
              onClick={() => handleGroupClick(isSubscribed, group.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className='flex flex-col'>
                      <p className="text-xl sm:text-2xl font-bold text-foreground">{group.name}</p>
                      <p className="text-xs text-muted-foreground">{group.number ? 'Updated Today' : 'Result Awaited'}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 h-20 w-24 bg-secondary/50 rounded-lg border-2 border-dashed">
                    {isSubscribed ? (
                      <p className="text-3xl font-mono font-bold tracking-widest text-primary">{group.number || '??'}</p>
                    ) : (
                      <Button variant="default" size="sm" onClick={(e) => { e.stopPropagation(); router.push('/subscriptions'); }}>
                        Subscribe
                      </Button>
                    )}
                  </div>
                </div>
                 {isSubscribed && group.pastResults && group.pastResults.length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Past Results</p>
                      <ul className="flex justify-between text-sm text-muted-foreground">
                        {group.pastResults.slice(0, 3).map((result: {date: string; number: string}) => (
                           <li key={result.date} className="flex flex-col items-center text-xs">
                              <span className="font-mono text-foreground tracking-widest text-base">{result.number}</span>
                              <span className="text-xs text-muted-foreground/80">{result.date}</span> 
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
            <div className="text-center text-muted-foreground pt-10 col-span-full">
                <p>No groups available yet.</p>
                <p className="text-sm">Please check back later.</p>
            </div>
        )}
      </div>
    </div>
  );
}
