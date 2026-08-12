/**
 * Dependency abstraction for the callable-function handlers.
 *
 * The handlers contain all real business logic (authz, input validation,
 * cleanup ordering, compensating error handling). Only the low-level
 * Firebase Auth / Firestore I/O is abstracted behind this small interface so
 * the handlers can be unit-tested without instantiating the real Admin SDK,
 * while still exercising meaningful logic.
 */

export interface AuthContext {
  uid?: string | null;
}

export interface UserRecord {
  role?: string;
  status?: string;
  classIds?: string[];
}

export interface ClassRecord {
  teacherId?: string | null;
  studentCount?: number;
}

/** A single Firestore transaction. All mutations commit atomically. */
export interface Transaction {
  getUser(uid: string): Promise<UserRecord | null>;
  getClass(classId: string): Promise<ClassRecord | null>;
  /** All membership doc ids for the (class, student) pair (dedupe check). */
  getMemberships(classId: string, studentId: string): Promise<string[]>;
  /** Returns memberships owned by a user across all classes (cleanup). */
  getUserMemberships(uid: string): Promise<{ classId: string; membershipId: string }[]>;
  setMembership(membershipId: string, classId: string, studentId: string): void;
  deleteMembership(membershipId: string): void;
  updateUserClassIds(uid: string, classIds: string[]): void;
  updateClassStudentCount(classId: string, count: number): void;
}

export interface AdminServices {
  readUser(uid: string): Promise<UserRecord | null>;
  readClass(classId: string): Promise<ClassRecord | null>;
  runTransaction<T>(fn: (tx: Transaction) => T | Promise<T>): Promise<T>;
  createAuthUser(p: { email: string; password: string; displayName: string }): Promise<string>;
  setCustomClaims(uid: string, role: string): Promise<void>;
  deleteAuthUser(uid: string): Promise<void>;
  writeUserProfile(
    uid: string,
    p: { email: string; displayName: string; role: string; status: string },
  ): Promise<void>;
  deleteUserProfile(uid: string): Promise<void>;
  /** Sets teacherId to null on all classes assigned to this teacher. */
  unassignTeacher(teacherId: string): Promise<number>;
}
