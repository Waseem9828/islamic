'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

const groups = [
  { id: 'faridabad', name: 'Faridabad' },
  { id: 'ghaziabad', name: 'Ghaziabad' },
  { id: 'gali', name: 'Gali' },
  { id: 'disawar', name: 'Disawar' },
];

export default function Home() {
  const router = useRouter();

  const handleGroupClick = (groupId: string) => {
    console.log(`User clicked on group: ${groupId}`);
    // Future: router.push(`/group/${groupId}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        {groups.map((group) => (
          <Card
            key={group.id}
            className="cursor-pointer hover:shadow-lg transition-shadow duration-300 active:scale-95"
            onClick={() => handleGroupClick(group.id)}
          >
            <CardHeader className="p-4">
              <CardTitle className="text-center text-lg">{group.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex flex-col items-center justify-center h-20 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">View</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
