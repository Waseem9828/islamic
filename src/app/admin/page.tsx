'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Users, List, Gem, IndianRupee, Settings } from 'lucide-react';

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
    description: 'View active user subscriptions.',
    icon: Gem,
    path: '/admin/subscriptions',
  },
  {
    title: 'Deposit Requests',
    description: 'Approve or reject user deposits.',
    icon: IndianRupee,
    path: '/admin/deposit-requests',
  },
  {
    title: 'Payment Settings',
    description: 'Set your UPI ID for deposits.',
    icon: Settings,
    path: '/admin/payment-settings',
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the central hub for managing your application.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>App Management</CardTitle>
          <CardDescription>Select a feature to manage your application.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {adminFeatures.map((feature) => (
              <Card
                key={feature.title}
                className="cursor-pointer hover:border-primary transition-colors duration-300 active:scale-95 bg-muted/30"
                onClick={() => router.push(feature.path)}
              >
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                  <feature.icon className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription className="text-xs">{feature.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
