'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useCollection, useFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function Home() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { data: groups, isLoading } = useCollection(collection(firestore, 'groups'));

  const handleGroupClick = (groupId: string) => {
    router.push(`/${groupId}`);
  };

  if (isLoading) {
    return <div>Loading groups...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        {groups?.map((group) => (
          <Card
            key={group.id}
            className="cursor-pointer hover:border-primary transition-colors duration-300 active:scale-95 bg-muted/30"
            onClick={() => handleGroupClick(group.id)}
          >
            <CardHeader className="p-4">
              <CardTitle className="text-center text-lg">{group.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex flex-col items-center justify-center h-20 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">View Number</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
