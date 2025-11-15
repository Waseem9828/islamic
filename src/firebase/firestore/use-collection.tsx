'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Firestore,
  type Query,
} from 'firebase/firestore';
import { useFirestore } from '../provider';

interface DocBase {
  id: string;
}

export function useCollection<T extends DocBase>(path: string, key?: string, value?: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    let q: Query<DocumentData>;
    if (key && value) {
      q = query(collection(firestore, path), where(key, '==', value));
    } else {
      q = query(collection(firestore, path));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
      setData(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, path, key, value]);

  return { data, loading };
}
