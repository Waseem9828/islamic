'use client';

import { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useUser } from '@/firebase';

export function useAdmin() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const adminDocRef = useMemo(() => {
    if (!user) return null;
    // Note the path to the admin roles collection
    return doc(firestore, 'roles_admin', user.uid);
  }, [user, firestore]);

  const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminDocRef);

  const isAdmin = adminDoc ? adminDoc.exists : false;

  return {
    isAdmin,
    isAdminLoading: isUserLoading || isAdminLoading,
  };
}
