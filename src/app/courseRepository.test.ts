import { describe, it, expect, vi, beforeEach } from 'vitest';
import { collection, getDocs, query, where, orderBy, addDoc, writeBatch, doc, arrayUnion } from 'firebase/firestore';
import { fetchTeacherCourses, createCourse, assignCourseToClass } from './courseRepository';

// Mock the entire firebase/firestore module
vi.mock('firebase/firestore', async (importOriginal) => {
  const original = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...original,
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    writeBatch: vi.fn(() => ({
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    })),
    doc: vi.fn(),
    arrayUnion: vi.fn(),
  };
});

vi.mock('@/shared/lib/firebase/client', () => ({
  getFirebaseServices: () => ({
    firestore: {}, // Mock firestore object
  }),
}));

describe('courseRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchTeacherCourses should query courses by teacherId', async () => {
    const mockSnapshot = { docs: [] };
    (getDocs as vi.Mock).mockResolvedValue(mockSnapshot);

    await fetchTeacherCourses('teacher123');

    expect(query).toHaveBeenCalled();
    expect(where).toHaveBeenCalledWith('teacherId', '==', 'teacher123');
    expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc');
  });

  it('createCourse should add a new document with correct data', async () => {
    const courseData = { title: 'New Course', description: 'Desc', level: 'beginner' as const, teacherId: 'teacher123', status: 'draft' as const };
    (addDoc as vi.Mock).mockResolvedValue({ id: 'newCourseId' });

    const newId = await createCourse(courseData);

    expect(addDoc).toHaveBeenCalled();
    expect((addDoc as vi.Mock).mock.calls[0][1]).toMatchObject(courseData);
    expect(newId).toBe('newCourseId');
  });

  it('assignCourseToClass should create a batch write to update both class and course', async () => {
    const courseId = 'course1';
    const classId = 'class1';

    await assignCourseToClass(courseId, classId);

    expect(writeBatch).toHaveBeenCalled();
    expect(arrayUnion).toHaveBeenCalledWith(courseId);
    expect(arrayUnion).toHaveBeenCalledWith(classId);
  });
});