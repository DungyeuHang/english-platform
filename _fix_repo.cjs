const fs = require('fs');
const path = 'd:/GitHub/english-platform/src/features/admin/lib/userRepository.ts';

const content = `import {
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
  type DocumentData,
} from 'firebase/firestore';
import { getFirebaseServices } from '@/shared/lib/firebase/client';
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

  try {
    const q = query(collection(firestore, USERS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    let users = snapshot.docs.map((doc) => docToUserProfile(doc));

    if (filter) {
      if (filter.role && filter.role !== 'all') {
        users = users.filter((u) => u.role === filter.role);
      }
      if (filter.status && filter.status !== 'all') {
        users = users.filter((u) => u.status === filter.status);
      }
      if (filter.searchTerm) {
        const term = filter.searchTerm.toLowerCase();
        users = users.filter(
          (u) => u.displayName?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term),
        );
      }
      if (filter.limit) {
        users = users.slice(0, filter.limit);
      }
    }

    return users;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return [];
  }
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
  };
}
`;

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed:', path);
