import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  setDoc,
  deleteDoc,
  where,
  type DocumentData,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { getFirebaseServices, getFunctions } from '@/shared/lib/firebase/client';
import { httpsCallable } from 'firebase/functions';
import type { UserProfile, UserRole, UserStatus } from '@/shared/utils/types';

const USERS_COLLECTION = 'users';

function getFirestore() {
  const { firestore } = getFirebaseServices();
  return firestore;
}

export interface UserFilter {
  searchTerm?: string;
  role?: UserRole | 'all';
  status?: UserStatus | 'all';
  limit?: number;
}

export interface PaginatedUsers {
  users: UserProfile[];
  total: number;
}

export async function fetchUsers(filter?: UserFilter): Promise<UserProfile[]> {
  const firestore = getFirestore();
  if (!firestore) return [];
  // ERROR HANDLING FIX: Removed try/catch block. Let the caller handle errors.

  const queryConstraints = [orderBy('createdAt', 'desc')];

  // Apply server-side filters
  if (filter?.role && filter.role !== 'all') {
    queryConstraints.push(where('role', '==', filter.role));
  }
  if (filter?.status && filter.status !== 'all') {
    queryConstraints.push(where('status', '==', filter.status));
  }
  // BUG FIX: Implement the 'limit' filter that was declared but not used.
  if (filter?.limit) {
    queryConstraints.push(firestoreLimit(filter.limit));
  }
  // NOTE: Firestore does not support native partial text search (like SQL's `LIKE`).
  // The `searchTerm` filter is still applied client-side. For production, a dedicated
  // search service like Algolia is recommended.

  const q = query(collection(firestore, USERS_COLLECTION), ...queryConstraints);
  const snapshot = await getDocs(q);
  let users = snapshot.docs.map((doc) => docToUserProfile(doc)).filter((u): u is UserProfile => u !== null);

  // Apply client-side filter for searchTerm
  if (filter?.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      users = users.filter(
        (u) => u.displayName?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term),
      );
  }

  return users;
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const firestore = getFirestore();
  if (!firestore) return null;

  try {
    const snap = await getDoc(doc(firestore, USERS_COLLECTION, uid));
    if (!snap.exists()) return null;
    return docToUserProfile(snap);
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return null;
  }
}

export async function getUserStats(): Promise<{
  total: number;
  byRole: Record<UserRole, number>;
  byStatus: Record<UserStatus, number>;
}> {
  const users = await fetchUsers();
  const byRole: Record<UserRole, number> = { admin: 0, teacher: 0, student: 0 };
  const byStatus: Record<UserStatus, number> = { active: 0, disabled: 0 };

  for (const user of users) {
    byRole[user.role] = (byRole[user.role] || 0) + 1;
    byStatus[user.status] = (byStatus[user.status] || 0) + 1;
  }

  return {
    total: users.length,
    byRole,
    byStatus,
  };
}

export async function updateUserRole(uid: string, role: UserRole): Promise<UserProfile | null> {
  const firestore = getFirestore();
  if (!firestore) return null;

  const userRef = doc(firestore, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    role,
    updatedAt: serverTimestamp(),
  });

  return fetchUserProfile(uid);
}

export async function updateUserStatus(uid: string, status: UserStatus): Promise<UserProfile | null> {
  const firestore = getFirestore();
  if (!firestore) return null;

  const userRef = doc(firestore, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    status,
    updatedAt: serverTimestamp(),
  });

  return fetchUserProfile(uid);
}

export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<UserProfile, 'displayName' | 'photoURL'>>,
): Promise<UserProfile | null> {
  const firestore = getFirestore();
  if (!firestore) return null;

  const userRef = doc(firestore, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });

  return fetchUserProfile(uid);
}

export async function deleteUserDocument(uid: string): Promise<boolean> {
  const firestore = getFirestore();
  if (!firestore) return false;

  const userRef = doc(firestore, USERS_COLLECTION, uid);
  await deleteDoc(userRef);
  return true;
}

export async function createUserProfile(data: {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  status?: UserStatus;
}): Promise<UserProfile | null> {
  const firestore = getFirestore();
  if (!firestore) return null;

  const userRef = doc(firestore, USERS_COLLECTION, data.uid);
  await setDoc(userRef, {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName || null,
    role: data.role,
    status: data.status || 'active',
    photoURL: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return fetchUserProfile(data.uid);
}

export async function updateUserClassIds(uid: string, classIds: string[]): Promise<void> {
  const firestore = getFirestore();
  if (!firestore) return;

  const userRef = doc(firestore, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    classIds,
    updatedAt: serverTimestamp(),
  });
}

// --- Security-Critical Admin Operations (Callable Functions) ---

/**
 * Calls a secure Cloud Function to create a new user.
 * This prevents exposing sensitive operations to the client and keeps the admin's auth state intact.
 */
export async function callCreateUser(data: {
  email: string;
  displayName: string;
  role: UserRole;
  password: string;
}): Promise<{ success: boolean; uid: string; message: string }> {
  const functions = getFunctions();
  if (!functions) throw new Error('Firebase Functions not initialized.');

  const createUser = httpsCallable(functions, 'createUser');
  const result = await createUser(data);
  return result.data as { success: boolean; uid: string; message: string };
}

/**
 * Calls a secure Cloud Function to delete a user.
 * This ensures both the Auth record and Firestore data are properly removed.
 */
export async function callDeleteUser(data: { uid: string }): Promise<{ success: boolean; uid: string; message: string }> {
  const functions = getFunctions();
  if (!functions) throw new Error('Firebase Functions not initialized.');

  const deleteUser = httpsCallable(functions, 'deleteUser');
  const result = await deleteUser(data);
  return result.data as { success: boolean; uid: string; message: string };
}

function docToUserProfile(snap: {
  id: string;
  data: () => DocumentData;
  exists: () => boolean;
}): UserProfile | null {
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    uid: snap.id,
    email: data.email || '',
    displayName: data.displayName || null,
    role: data.role || 'student',
    status: data.status || 'active',
    photoURL: data.photoURL || null,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : null,
    classIds: data.classIds || [],
  };
}
