'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, WithId, useMemoFirebase } from '@/firebase';

export interface Group {
  name: string;
}

export function useGroups() {
  const firestore = useFirestore();

  const groupsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'groups'), orderBy('name'));
  }, [firestore]);

  const { data: groupsData, isLoading, error } = useCollection<Group>(groupsQuery);
  
  const groups: WithId<Group>[] = groupsData || [];

  return {
    groups,
    isLoading,
    error,
  };
}
