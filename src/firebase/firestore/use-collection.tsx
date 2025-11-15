'use client';
import {
  FirestoreError,
  Query,
  onSnapshot,
  QuerySnapshot,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function useCollection<T>(query: Query | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setData(null);
      setIsLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot) => {
        const result: T[] = [];
        snapshot.forEach((doc) => {
          result.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(result);
        setIsLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, error, isLoading };
}
