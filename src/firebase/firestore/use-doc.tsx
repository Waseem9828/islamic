'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, type DocumentData, type Firestore } from 'firebase/firestore';
import { useFirestore } from '../provider';

interface DocBase {
  id: string;
}

export function useDoc<T extends DocBase>(path: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const docRef = doc(firestore, path);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setData({ id: snapshot.id, ...snapshot.data() } as T);
      } else {
        setData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, path]);

  return { data, loading };
}
