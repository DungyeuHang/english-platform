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
  writeBatch,
  where,
  addDoc,
  increment,
  type DocumentData,
} from 'firebase/firestore';
import { getFirebaseServices } from '@/shared/lib/firebase/client';
import type { ClassProfile, ClassStatus, UserProfile } from '@/shared/utils/types';
import { fetchUsers, fetchUserProfile } from './userRepository';

const CLASSES_COLLECTION = 'classes';
const MEMBERSHIPS_COLLECTION = 'classMemberships';

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

    const q = query(collection(firestore, CLASSES_COLLECTION), where('__name__', 'in', user.classIds));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToClassProfile);
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

  const usersSnapshot = await getDocs(query(collection(firestore, 'users'), where('__name__', 'in', studentIds)));
  return usersSnapshot.docs.map(d => ({
      uid: d.id,
      ...d.data()
  } as UserProfile));
}

export async function addStudentToClass(classId: string, studentId: string): Promise<void> {
  const firestore = getFirestore();
  if (!firestore) return;

  const student = await fetchUserProfile(studentId);
  if (!student || student.role !== 'student') {
    throw new Error('User is not a valid student.');
  }

  const membershipQuery = query(collection(firestore, MEMBERSHIPS_COLLECTION), where('classId', '==', classId), where('studentId', '==', studentId));
  const existingMembership = await getDocs(membershipQuery);
  if (!existingMembership.empty) {
    console.log('Student already in class');
    return;
  }

  const batch = writeBatch(firestore);

  // 1. Add to classMemberships collection
  const membershipRef = doc(collection(firestore, MEMBERSHIPS_COLLECTION));
  batch.set(membershipRef, {
    classId,
    studentId,
    joinedAt: serverTimestamp(),
  });

  // 2. Update user's classIds array
  const userRef = doc(firestore, 'users', studentId);
  const newClassIds = [...(student.classIds || []), classId];
  batch.update(userRef, { classIds: newClassIds });

  // 3. Increment studentCount on the class document
  const classRef = doc(firestore, CLASSES_COLLECTION, classId);
  batch.update(classRef, { studentCount: increment(1) });

  await batch.commit();
}

export async function removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    const firestore = getFirestore();
    if (!firestore) return;

    const student = await fetchUserProfile(studentId);
    if (!student) return;

    const batch = writeBatch(firestore);

    // 1. Remove from classMemberships
    const membershipQuery = query(collection(firestore, MEMBERSHIPS_COLLECTION), where('classId', '==', classId), where('studentId', '==', studentId));
    const membershipSnapshot = await getDocs(membershipQuery);
    if (!membershipSnapshot.empty) {
        const membershipDoc = membershipSnapshot.docs[0];
        batch.delete(membershipDoc.ref);
    }

    // 2. Update user's classIds array
    const userRef = doc(firestore, 'users', studentId);
    const newClassIds = (student.classIds || []).filter(id => id !== classId);
    batch.update(userRef, { classIds: newClassIds });

    // 3. Decrement studentCount on the class document
    const classRef = doc(firestore, CLASSES_COLLECTION, classId);
    batch.update(classRef, { studentCount: increment(-1) });

    await batch.commit();
}