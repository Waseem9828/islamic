'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { auth } = useFirebase();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      // Firebase might not be initialized yet
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          if (idTokenResult.claims.admin) {
            setIsAdmin(true);
          } else {
            // User is logged in but not an admin
            router.push('/'); // Redirect to home page or a not-authorized page
          }
        } catch (error) {
          console.error("Error getting user token:", error);
          router.push('/admin/login');
        }
      } else {
        // No user is logged in
        router.push('/admin/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg font-semibold">Loading Admin Panel...</div>
        {/* You can add a spinner here */}
      </div>
    );
  }

  if (isAdmin) {
    return <>{children}</>;
  }

  // This part will be briefly visible before the redirect happens
  return null;
}
