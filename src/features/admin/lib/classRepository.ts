import {
  collection,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  where,
  addDoc,
  type DocumentData,
} from 'firebase/firestore';
import { getFirebaseServices, getFunctions } from '@/shared/lib/firebase/client';
import { httpsCallable } from 'firebase/functions';
import type { ClassProfile, ClassStatus, UserProfile } from '@/shared/utils/types';
import { fetchUsers, fetchUserProfile } from './userRepository';

const CLASSES_COLLECTION = 'classes';
const MEMBERSHIPS_COLLECTION = 'classMemberships';

/**
 * Splits an array into chunks of a specified size.
 * Firestore 'in' queries are limited (currently to 30).
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function getFirestore() {
  const { firestore } = getFirebaseServices();
  return firestore;
}

function docToClassProfile(doc: DocumentData): ClassProfile {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    code: data.code,
    description: data.description || null,
    teacherId: data.teacherId || null,
    status: data.status || 'active',
    createdAt: data.createdAt?.toDate() || null,
    updatedAt: data.updatedAt?.toDate() || null,
    studentCount: data.studentCount || 0,
  };
}

export async function fetchClasses(): Promise<ClassProfile[]> {
  const firestore = getFirestore();
  if (!firestore) return [];

  const q = query(collection(firestore, CLASSES_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  const classes = snapshot.docs.map(docToClassProfile);

  // Enrich with teacher and student count
  const teachers = await fetchUsers({ role: 'teacher' });
  const teacherMap = new Map(teachers.map((t) => [t.uid, t]));

  // Vấn đề N+1 query đã được giải quyết bằng cách phi chuẩn hóa studentCount.
  // Giờ đây, chúng ta chỉ cần làm phong phú thêm thông tin giáo viên.
  for (const c of classes) {
    if (c.teacherId) {
      c.teacher = teacherMap.get(c.teacherId) || null;
    }
  }

  return classes;
}

export async function fetchTeacherClasses(teacherId: string): Promise<ClassProfile[]> {
    const firestore = getFirestore();
    if (!firestore) return [];

    const q = query(collection(firestore, CLASSES_COLLECTION), where('teacherId', '==', teacherId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const classes = snapshot.docs.map(docToClassProfile);

    // Vấn đề N+1 query đã được giải quyết. Dữ liệu studentCount đã có sẵn.
    return classes; // Không cần vòng lặp nữa
}

export async function fetchStudentClasses(studentId: string): Promise<ClassProfile[]> {
    const firestore = getFirestore();
    if (!firestore) return [];

    const user = await fetchUserProfile(studentId);
    if (!user || !user.classIds || user.classIds.length === 0) return [];

    // SCALABILITY FIX: Chunk the classIds to avoid Firestore 'in' query limit (30).
    const classIdChunks = chunkArray(user.classIds, 30);
    const classPromises = classIdChunks.map(chunk => {
      const q = query(collection(firestore, CLASSES_COLLECTION), where('__name__', 'in', chunk));
      return getDocs(q);
    });

    const snapshots = await Promise.all(classPromises);
    const classes = snapshots.flatMap(snapshot => snapshot.docs.map(docToClassProfile));

    // Sort classes by creation date as the original query intended but couldn't with an 'in' filter.
    classes.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));

    return classes;
}

export async function createClass(data: Omit<ClassProfile, 'id' | 'createdAt' | 'updatedAt' | 'studentCount' | 'teacher'>): Promise<string> {
  const firestore = getFirestore();
  if (!firestore) throw new Error('Firestore not available');

  // Check for unique class code
  const codeQuery = query(collection(firestore, CLASSES_COLLECTION), where('code', '==', data.code));
  const codeSnapshot = await getDocs(codeQuery);
  if (!codeSnapshot.empty) {
    throw new Error(`Class code "${data.code}" already exists.`);
  }

  const docRef = await addDoc(collection(firestore, CLASSES_COLLECTION), {
    ...data,
    studentCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateClass(id: string, data: Partial<ClassProfile>): Promise<void> {
  const firestore = getFirestore();
  if (!firestore) return;
  const classRef = doc(firestore, CLASSES_COLLECTION, id);
  await updateDoc(classRef, { ...data, updatedAt: serverTimestamp() });
}

export async function fetchClassMembers(classId: string): Promise<UserProfile[]> {
  const firestore = getFirestore();
  if (!firestore) return [];

  const q = query(collection(firestore, MEMBERSHIPS_COLLECTION), where('classId', '==', classId));
  const snapshot = await getDocs(q);
  const studentIds = snapshot.docs.map(d => d.data().studentId);

  if (studentIds.length === 0) return [];

  // SCALABILITY FIX: Chunk the studentIds to avoid Firestore 'in' query limit (30).
  const studentIdChunks = chunkArray(studentIds, 30);
  const userPromises = studentIdChunks.map(chunk => {
    const q = query(collection(firestore, 'users'), where('__name__', 'in', chunk));
    return getDocs(q);
  });

  const snapshots = await Promise.all(userPromises);
  const users = snapshots.flatMap(snapshot => snapshot.docs.map(d => ({
      uid: d.id,
      ...d.data()
  } as UserProfile)));

  return users;
}

/**
 * Securely adds a student to a class by calling a Cloud Function.
 * This ensures all authorization and data consistency logic is handled on the server.
 */
export async function addStudentToClass(
  classId: string,
  studentId: string,
): Promise<{ success: boolean; message: string }> {
  const functions = getFunctions();
  if (!functions) throw new Error('Firebase Functions not initialized.');
  const addStudent = httpsCallable(functions, 'addStudentToClass');
  const result = await addStudent({ classId, studentId });
  return result.data as { success: boolean; message: string };
}

/**
 * Securely removes a student from a class by calling a Cloud Function.
 * This ensures all authorization and data consistency logic is handled on the server.
 */
export async function removeStudentFromClass(
  classId: string,
  studentId: string,
): Promise<{ success: boolean; message: string }> {
  const functions = getFunctions();
  if (!functions) throw new Error('Firebase Functions not initialized.');
  const removeStudent = httpsCallable(functions, 'removeStudentFromClass');
  const result = await removeStudent({ classId, studentId });
  return result.data as { success: boolean; message: string };
}