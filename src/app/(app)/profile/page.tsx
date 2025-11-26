
import { Suspense } from 'react';
import { ProfileForm } from './profile-form';
import { Skeleton } from '@/components/ui/skeleton';


function ProfileSkeleton() {
    return (
        <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
                <Skeleton className="h-[300px] w-full" />
            </div>
            <div className="md:col-span-2">
                <Skeleton className="h-[400px] w-full" />
            </div>
        </div>
    );
}


export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileForm />
      </Suspense>
    </div>
  );
}
