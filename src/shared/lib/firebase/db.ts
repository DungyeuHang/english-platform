import { collection, type CollectionReference } from 'firebase/firestore';
import { getFirebaseServices } from './client';

/**
 * Repository-style access to Firestore collections.
 *
 * UI code should go through this module (or a feature repository built on
 * top of it) instead of constructing Firestore references/view directly.
 * This keeps the data-access shape stable and centralized so it can be
 * swapped or extended later without touching components.
 */

export function getCollectionRef<T = Record<string, unknown>>(
  name: string,
): CollectionReference<T> | null {
  const { firestore } = getFirebaseServices();
  if (!firestore) {
    return null;
  }
  return collection(firestore, name) as CollectionReference<T>;
}