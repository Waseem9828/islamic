
'use client';

import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useFirebase, useUser } from '@/firebase';

interface AdminStatus {
  isAdmin: boolean;
  isAdminLoading: boolean;
}

/**
 * @description Custom hook to check if the current user is an admin by calling a Cloud Function.
 * @returns {isAdmin: boolean, isAdminLoading: boolean}
 */
export const useAdmin = (): AdminStatus => {
  const { functions } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  useEffect(() => {
    // Don't do anything until Firebase auth state is resolved.
    if (isUserLoading) {
      return;
    }

    // If there's no user, they can't be an admin.
    if (!user) {
      setIsAdmin(false);
      setIsAdminLoading(false);
      return;
    }

    // If we have a user and functions are available, call the Cloud Function.
    if (user && functions) {
      const checkAdmin = httpsCallable(functions, 'checkAdminStatus');
      checkAdmin()
        .then((result) => {
          const isAdminResult = (result.data as { isAdmin: boolean }).isAdmin;
          setIsAdmin(isAdminResult);
        })
        .catch((error) => {
          console.error('Error calling checkAdminStatus function:', error);
          setIsAdmin(false);
        })
        .finally(() => {
          setIsAdminLoading(false);
        });
    } else {
        // If functions aren't ready for some reason, assume not admin.
        setIsAdmin(false);
        setIsAdminLoading(false);
    }
  }, [user, isUserLoading, functions]);

  return { isAdmin, isAdminLoading };
};
