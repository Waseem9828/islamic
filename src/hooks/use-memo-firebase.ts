import { useMemo } from "react";
import {
  DocumentReference,
  Query,
  collection,
  doc,
  query,
} from "firebase/firestore";

type FirebaseRef = DocumentReference | Query | null;

export function useMemoFirebase<T extends FirebaseRef>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo<T>(() => {
    const ref = factory();
    if (!ref) {
      return ref as T;
    }
    if (ref instanceof DocumentReference) {
      return doc(ref.firestore, ref.path) as T;
    } else if (ref instanceof Query) {
      const q = ref as Query;
      // @ts-ignore
      return query(q._query.path, ...q._query.constraints) as T;
    }
    return ref;
  }, deps);
}
