'use client';
import {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  FirestoreError,
  onSnapshot,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function useDoc<T>(ref: DocumentReference<DocumentData> | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      ref,
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, error, isLoading };
}
