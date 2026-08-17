import {
  collection,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  where,
  addDoc,
  doc,
  writeBatch,
  type DocumentData,
  getDoc,
  FieldValue,
  arrayUnion,
} from 'firebase/firestore';
import { getFirebaseServices } from '@/shared/lib/firebase/client';
import type { CourseProfile, ModuleProfile, LessonProfile } from '@/shared/utils/types';

const COURSES_COLLECTION = 'courses';
const MODULES_COLLECTION = 'modules';
const LESSONS_COLLECTION = 'lessons';
const CLASSES_COLLECTION = 'classes';

function getFirestore() {
  const { firestore } = getFirebaseServices();
  if (!firestore) throw new Error('Firestore not available');
  return firestore;
}

// --- Data Conversion Helpers ---

function docToCourse(doc: DocumentData): CourseProfile {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    level: data.level,
    thumbnail: data.thumbnail || null,
    teacherId: data.teacherId,
    classIds: data.classIds || [],
    status: data.status,
    createdAt: data.createdAt?.toDate() || null,
    updatedAt: data.updatedAt?.toDate() || null,
  };
}

function docToModule(doc: DocumentData): ModuleProfile {
  const data = doc.data();
  return {
    id: doc.id,
    courseId: data.courseId,
    title: data.title,
    order: data.order,
    description: data.description || null,
  };
}

function docToLesson(doc: DocumentData): LessonProfile {
  const data = doc.data();
  return {
    id: doc.id,
    moduleId: data.moduleId,
    title: data.title,
    order: data.order,
    type: data.type,
    content: data.content,
    status: data.status,
    createdAt: data.createdAt?.toDate() || null,
    updatedAt: data.updatedAt?.toDate() || null,
  };
}

// --- Repository Functions ---

/**
 * Fetches all courses created by a specific teacher.
 */
export async function fetchTeacherCourses(teacherId: string): Promise<CourseProfile[]> {
  const firestore = getFirestore();
  const q = query(
    collection(firestore, COURSES_COLLECTION),
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToCourse);
}

/**
 * Fetches all published courses assigned to a specific class.
 */
export async function fetchPublishedCoursesByClass(classId: string): Promise<CourseProfile[]> {
  const firestore = getFirestore();
  const q = query(
    collection(firestore, COURSES_COLLECTION),
    where('classIds', 'array-contains', classId),
    where('status', '==', 'published'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToCourse);
}

/**
 * Fetches the full nested structure of a course (course, modules, lessons).
 */
export async function fetchCourseStructure(courseId: string) {
  const firestore = getFirestore();
  const courseSnap = await getDoc(doc(firestore, COURSES_COLLECTION, courseId));
  if (!courseSnap.exists()) throw new Error('Course not found');

  const course = docToCourse(courseSnap);

  const modulesQuery = query(collection(firestore, MODULES_COLLECTION), where('courseId', '==', courseId), orderBy('order'));
  const modulesSnap = await getDocs(modulesQuery);
  const modules = modulesSnap.docs.map(docToModule);

  const lessonsByModule: Record<string, LessonProfile[]> = {};
  for (const mod of modules) {
    const lessonsQuery = query(collection(firestore, LESSONS_COLLECTION), where('moduleId', '==', mod.id), orderBy('order'));
    const lessonsSnap = await getDocs(lessonsQuery);
    lessonsByModule[mod.id] = lessonsSnap.docs.map(docToLesson);
  }

  return { course, modules, lessonsByModule };
}

/**
 * Creates a new course.
 */
export async function createCourse(data: Omit<CourseProfile, 'id' | 'createdAt' | 'updatedAt' | 'classIds'>): Promise<string> {
  const firestore = getFirestore();
  const docRef = await addDoc(collection(firestore, COURSES_COLLECTION), {
    ...data,
    classIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Atomically assigns a course to a class, updating both documents.
 */
export async function assignCourseToClass(courseId: string, classId: string): Promise<void> {
  const firestore = getFirestore();
  const batch = writeBatch(firestore);

  const classRef = doc(firestore, CLASSES_COLLECTION, classId);
  batch.update(classRef, { courseIds: arrayUnion(courseId) });

  const courseRef = doc(firestore, COURSES_COLLECTION, courseId);
  batch.update(courseRef, { classIds: arrayUnion(classId) });

  await batch.commit();
}