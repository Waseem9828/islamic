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
    // In the future, this will check for subscription
    // For now, it can navigate to a placeholder page or show a message
    console.log(`User clicked on group: ${groupId}`);
    // Example of navigation: router.push(`/group/${groupId}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 pt-12 sm:p-24">
      <div className="w-full max-w-5xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-300"
              onClick={() => handleGroupClick(group.id)}
            >
              <CardHeader>
                <CardTitle className="text-center text-2xl">{group.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-24 bg-muted rounded-md">
                  <p className="text-muted-foreground">Click to view</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
