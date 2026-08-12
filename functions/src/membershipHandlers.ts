import { HttpsError } from 'firebase-functions/v2/https';
import type { AdminServices, AuthContext } from './services';
import { assertString, requireAuth } from './validation';

export interface MembershipResult {
  success: boolean;
  message: string;
}

function isClassId(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isStudentId(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * Securely adds a student to a class.
 *
 * - Caller must be an authenticated, active admin OR the teacher assigned to
 *   the class. Authorization is verified server-side.
 * - Uses a deterministic membership id (`classId_studentId`) and a transaction
 *   so duplicates and race conditions cannot create inconsistent state or
 *   inflate the student count.
 * - Idempotent: if the student is already a member, no mutation is performed.
 */
export async function addStudentToClassHandler(
  data: unknown,
  ctx: AuthContext,
  svc: AdminServices,
): Promise<MembershipResult> {
  const callerUid = requireAuth(ctx);
  const caller = await svc.readUser(callerUid);
  if (!caller || caller.status === 'disabled' || (caller.role !== 'admin' && caller.role !== 'teacher')) {
    throw new HttpsError('permission-denied', 'You do not have permission to manage class members.');
  }
  const isAdmin = caller.role === 'admin';

  const body = (data ?? {}) as { classId?: unknown; studentId?: unknown };
  const classId = assertString(body.classId, 'classId');
  const studentId = assertString(body.studentId, 'studentId');
  if (!isClassId(classId) || !isStudentId(studentId)) {
    throw new HttpsError('invalid-argument', 'classId and studentId are required.');
  }

  await svc.runTransaction(async (tx) => {
    const cls = await tx.getClass(classId);
    if (!cls) {
      throw new HttpsError('not-found', 'Class not found.');
    }
    if (!isAdmin && cls.teacherId !== callerUid) {
      throw new HttpsError('permission-denied', 'You are not assigned to this class.');
    }

    const student = await tx.getUser(studentId);
    if (!student) {
      throw new HttpsError('not-found', 'Student not found.');
    }
    if (student.role !== 'student') {
      throw new HttpsError('invalid-argument', 'The selected user is not a student.');
    }

    // Idempotency / duplicate guard: only act when there is no existing member record.
    const existing = await tx.getMemberships(classId, studentId);
    if (existing.length > 0) {
      return;
    }

    tx.setMembership(`${classId}_${studentId}`, classId, studentId);
    const newClassIds = Array.from(new Set([...(student.classIds || []), classId]));
    tx.updateUserClassIds(studentId, newClassIds);
    tx.updateClassStudentCount(classId, (cls.studentCount || 0) + 1);
  });

  return { success: true, message: 'Student added to class.' };
}

/**
 * Securely removes a student from a class.
 *
 * - Caller must be an authenticated, active admin OR the teacher assigned to
 *   the class.
 * - Removes every membership record for the (class, student) pair (handles
 *   legacy duplicates) and compensates the student count by the number of
 *   records actually removed.
 * - Idempotent: removing a non-member is a no-op, not an error.
 * - The count is never allowed to drop below zero.
 */
export async function removeStudentFromClassHandler(
  data: unknown,
  ctx: AuthContext,
  svc: AdminServices,
): Promise<MembershipResult> {
  const callerUid = requireAuth(ctx);
  const caller = await svc.readUser(callerUid);
  if (!caller || caller.status === 'disabled' || (caller.role !== 'admin' && caller.role !== 'teacher')) {
    throw new HttpsError('permission-denied', 'You do not have permission to manage class members.');
  }
  const isAdmin = caller.role === 'admin';

  const body = (data ?? {}) as { classId?: unknown; studentId?: unknown };
  const classId = assertString(body.classId, 'classId');
  const studentId = assertString(body.studentId, 'studentId');
  if (!isClassId(classId) || !isStudentId(studentId)) {
    throw new HttpsError('invalid-argument', 'classId and studentId are required.');
  }

  await svc.runTransaction(async (tx) => {
    const cls = await tx.getClass(classId);
    if (!cls) {
      throw new HttpsError('not-found', 'Class not found.');
    }
    if (!isAdmin && cls.teacherId !== callerUid) {
      throw new HttpsError('permission-denied', 'You are not assigned to this class.');
    }

    const memberships = await tx.getMemberships(classId, studentId);
    if (memberships.length === 0) {
      return; // Not a member: idempotent no-op.
    }

    for (const id of memberships) {
      tx.deleteMembership(id);
    }

    const student = await tx.getUser(studentId);
    if (student) {
      const newClassIds = (student.classIds || []).filter((id) => id !== classId);
      tx.updateUserClassIds(studentId, newClassIds);
    }

    const newCount = Math.max(0, (cls.studentCount || 0) - memberships.length);
    tx.updateClassStudentCount(classId, newCount);
  });

  return { success: true, message: 'Student removed from class.' };
}
