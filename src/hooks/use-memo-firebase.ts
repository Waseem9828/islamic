import { useMemo } from 'react';

/**
 * A hook to memoize Firebase queries and references.
 *
 * This is critical for performance, as it prevents re-renders from
 * creating new query/reference objects, which would cause infinite
 * loops in `useEffect` hooks that depend on them.
 *
 * It's a lightweight wrapper around `useMemo` that provides a more
 * descriptive name for its purpose.
 *
 * @param factory A function that returns a Firebase query or reference.
 * @param deps The dependencies to watch for changes.
 * @returns The memoized query or reference.
 */
export const useMemoFirebase = (factory: () => any, deps: any[]) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
};
