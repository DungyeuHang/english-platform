import { HttpsError } from 'firebase-functions/v2/https';
import type { AdminServices, AuthContext } from './services';
import {
  assertNonEmptyId,
  assertString,
  assertValidCreateRole,
  assertValidEmail,
  assertValidPassword,
  requireActiveAdmin,
  requireAuth,
} from './validation';

export interface CreateUserResult {
  success: boolean;
  uid: string;
  message: string;
}

export interface DeleteUserResult {
  success: boolean;
  uid: string;
  message: string;
}

/**
 * Securely creates a user (Auth + Firestore profile) as an admin.
 *
 * - Requires an authenticated, active admin caller.
 * - Validates every input server-side.
 * - Only allows creating `student` or `teacher` roles (admins are bootstrapped,
 *   so the browser can never escalate a new user to admin).
 * - Creates the Auth user, sets custom claims, then writes the Firestore
 *   profile. If the profile write fails, the freshly created Auth user is
 *   deleted so we do not leave an orphaned account.
 */
export async function createUserHandler(
  data: unknown,
  ctx: AuthContext,
  svc: AdminServices,
): Promise<CreateUserResult> {
  const callerUid = requireAuth(ctx);
  await requireActiveAdmin(svc, callerUid);

  const body = (data ?? {}) as Record<string, unknown>;
  const email = assertString(body.email, 'email');
  const password = assertString(body.password, 'password');
  const displayName = assertString(body.displayName, 'displayName');
  const role = assertString(body.role, 'role');

  assertValidEmail(email);
  assertValidPassword(password);
  assertValidCreateRole(role);

  let uid: string;
  try {
    uid = await svc.createAuthUser({ email, password, displayName });
  } catch (err) {
    throw mapCreateAuthError(err, email);
  }

  try {
    await svc.setCustomClaims(uid, role);
    await svc.writeUserProfile(uid, { email, displayName, role, status: 'active' });
  } catch (err) {
    // Compensating cleanup: the Auth account was created but we could not
    // finalize the profile. Remove the Auth account to avoid an orphan.
    try {
      await svc.deleteAuthUser(uid);
    } catch (cleanupErr) {
      // Deliberately swallow: keep the original failure as the surfaced error
      // and log the cleanup problem server-side.
      console.error('createUser: failed to roll back Auth user after profile error', cleanupErr);
    }
    throw mapProfileError(err);
  }

  return { success: true, uid, message: `User ${displayName} created successfully.` };
}

/**
 * Securely deletes a user (Firestore profile + memberships + Auth account) as an admin.
 *
 * Deletion is intentionally NOT atomic across Firestore and Auth. Design:
 *   1. Remove Firestore-owned records first (memberships, class counts, teacher
 *      assignments, user profile) so no orphan Firestore data is left behind.
 *   2. Delete the Auth account last. If that step fails, the Firestore data is
 *      already consistent and the leftover Auth account is blocked from use
 *      (no profile => login is rejected by the app). The failure is surfaced
 *      as a clear, non-sensitive partial-failure message.
 */
export async function deleteUserHandler(
  data: unknown,
  ctx: AuthContext,
  svc: AdminServices,
): Promise<DeleteUserResult> {
  const callerUid = requireAuth(ctx);
  await requireActiveAdmin(svc, callerUid);

  const body = (data ?? {}) as Record<string, unknown>;
  const uid = assertString(body.uid, 'uid');
  assertNonEmptyId(uid, 'uid');

  if (uid === callerUid) {
    throw new HttpsError('failed-precondition', 'You cannot delete your own account.');
  }

  const target = await svc.readUser(uid);
  if (!target) {
    throw new HttpsError('not-found', 'User not found.');
  }

  // Unassign any classes this user teaches before removing them.
  if (target.role === 'teacher') {
    await svc.unassignTeacher(uid);
  }

  // Remove every membership (with class count compensation) and the profile.
  await svc.runTransaction(async (tx) => {
    const memberships = await tx.getUserMemberships(uid);
    const removedByClass: Record<string, number> = {};
    for (const m of memberships) {
      tx.deleteMembership(m.membershipId);
      removedByClass[m.classId] = (removedByClass[m.classId] || 0) + 1;
    }
    for (const [classId, count] of Object.entries(removedByClass)) {
      const cls = await tx.getClass(classId);
      if (cls) {
        tx.updateClassStudentCount(classId, Math.max(0, (cls.studentCount || 0) - count));
      }
    }
  });
  await svc.deleteUserProfile(uid);

  try {
    await svc.deleteAuthUser(uid);
  } catch (err) {
    console.error(`deleteUser: Firestore cleaned but Auth deletion failed for ${uid}`, err);
    throw new HttpsError(
      'internal',
      'User data was removed, but the authentication account could not be deleted. Please contact support.',
    );
  }

  return { success: true, uid, message: 'User deleted successfully.' };
}

function mapCreateAuthError(err: unknown, email: string): HttpsError {
  const code = getErrorCode(err);
  if (code === 'auth/email-already-exists' || code === 'EMAIL_EXISTS') {
    return new HttpsError('already-exists', `A user with the email ${email} already exists.`);
  }
  if (code === 'auth/invalid-email' || code === 'INVALID_EMAIL') {
    return new HttpsError('invalid-argument', 'The provided email address is invalid.');
  }
  if (code === 'auth/invalid-password' || code === 'INVALID_PASSWORD') {
    return new HttpsError('invalid-argument', 'The provided password is invalid.');
  }
  return new HttpsError('internal', 'Failed to create the user account. Please try again.');
}

function mapProfileError(err: unknown): HttpsError {
  const code = getErrorCode(err);
  return new HttpsError(
    'internal',
    code === 'unavailable'
      ? 'User account was created but the profile could not be saved. Please try again.'
      : 'Failed to finalize the user profile. The account was rolled back.',
  );
}

function getErrorCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    return String((err as { code: unknown }).code);
  }
  return '';
}
