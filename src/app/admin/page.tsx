'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Users, List, Gem } from 'lucide-react';

const adminFeatures = [
  {
    title: 'Manage Numbers',
    description: 'Update daily numbers for all groups.',
    icon: List,
    path: '/admin/numbers',
  },
  {
    title: 'Manage Users',
    description: 'View and manage all registered users.',
    icon: Users,
    path: '/admin/users',
  },
  {
    title: 'Manage Subscriptions',
    description: 'View and manage user subscriptions.',
    icon: Gem,
    path: '/admin/subscriptions',
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
        <h1 className="text-2xl font-bold text-center">Admin Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {adminFeatures.map((feature) => (
                <Card
                    key={feature.title}
                    className="cursor-pointer hover:border-primary transition-colors duration-300 active:scale-95 bg-muted/30"
                    onClick={() => router.push(feature.path)}
                >
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                        <feature.icon className="w-8 h-8 text-muted-foreground" />
                        <div>
                            <CardTitle>{feature.title}</CardTitle>
                            <CardDescription>{feature.description}</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            ))}
        </div>
    </div>
  );
}
