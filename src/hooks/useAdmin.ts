'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase, useUser } from '@/firebase';

// Hardcoded super-admin UID from your security rules
const SUPER_ADMIN_UID = 'Mh28D81npYYDfC3z8mslVIPFu5H3';

interface AdminStatus {
  isAdmin: boolean;
  isAdminLoading: boolean;
}

/**
 * @description Custom hook to check if the current user is an admin.
 * An admin is defined as a user whose UID is in the 'roles_admin' collection
 * or who matches the hardcoded SUPER_ADMIN_UID.
 * @returns {isAdmin: boolean, isAdminLoading: boolean}
 */
export const useAdmin = (): AdminStatus => {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  useEffect(() => {
    // If user is still loading, we can't check for admin status yet.
    if (isUserLoading) {
      setIsAdminLoading(true);
      return;
    }

    // If there is no user, they can't be an admin.
    if (!user) {
      setIsAdmin(false);
      setIsAdminLoading(false);
      return;
    }

    // Check if the user is the hardcoded super-admin.
    if (user.uid === SUPER_ADMIN_UID) {
        setIsAdmin(true);
        setIsAdminLoading(false);
        return;
    }

    // Check if the user's UID is in the 'roles_admin' collection.
    const checkAdminStatus = async () => {
      if (!firestore) {
        setIsAdmin(false);
        setIsAdminLoading(false);
        return;
      }
      try {
        const adminRoleDoc = await getDoc(doc(firestore, 'roles_admin', user.uid));
        setIsAdmin(adminRoleDoc.exists());
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsAdminLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, isUserLoading, firestore]);

  return { isAdmin, isAdminLoading };
};
