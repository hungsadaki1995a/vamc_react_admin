import { hashKey } from '@tanstack/react-query';

/**
 * True when both values hash to the same query key (TanStack ignores undefined fields and key order).
 * [Search] with an unchanged filter on page 1 keeps the key, so the query does not run again: refetch it instead.
 */
export function isSameQuery(a: unknown, b: unknown): boolean {
  return hashKey([a]) === hashKey([b]);
}
