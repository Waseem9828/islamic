
import { Suspense } from 'react';
import { ProfileForm } from './profile-form';

export default function ProfilePage() {
  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <ProfileForm />
      </Suspense>
    </div>
  );
}
