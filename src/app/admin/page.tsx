
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Users, List, IndianRupee, Settings, Gem, LayoutDashboard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
  {
    title: 'Manage Subscriptions',
    description: 'Create and manage subscription plans.',
    icon: Gem,
    path: '/admin/subscriptions',
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome! From here you can manage all aspects of your application.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {adminFeatures.map((feature) => (
          <Card
            key={feature.title}
            className="cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-300 active:scale-95 group"
            onClick={() => router.push(feature.path)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{feature.title}</CardTitle>
              <feature.icon className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

       <Card className="mt-8">
          <CardHeader>
            <CardTitle>Go Back</CardTitle>
            <CardDescription>
              Return to the main application view.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/" passHref>
                <button className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                    <ArrowLeft className="h-4 w-4" />
                    Back to App
                </button>
            </Link>
          </CardContent>
        </Card>
    </div>
  );
}
