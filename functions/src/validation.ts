import { HttpsError } from 'firebase-functions/v2/https';
import type { AuthContext, UserRecord } from './services';

export const MIN_PASSWORD_LENGTH = 8;
export const ALLOWED_CREATE_ROLES = ['student', 'teacher'] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requireAuth(ctx: AuthContext): string {
  if (!ctx.uid) {
    throw new HttpsError('unauthenticated', 'You must be signed in to perform this action.');
  }
  return ctx.uid;
}

/** Returns the caller's user record or throws if it does not describe a valid active admin. */
export async function requireActiveAdmin(svc: {
  readUser(uid: string): Promise<UserRecord | null>;
}, uid: string): Promise<UserRecord> {
  const caller = await svc.readUser(uid);
  if (!caller || caller.role !== 'admin' || caller.status === 'disabled') {
    throw new HttpsError('permission-denied', 'You do not have permission to perform this action.');
  }
  return caller;
}

export function assertString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpsError('invalid-argument', `${field} is required.`);
  }
  return value.trim();
}

export function assertValidEmail(email: string): void {
  if (!EMAIL_RE.test(email)) {
    throw new HttpsError('invalid-argument', 'Please provide a valid email address.');
  }
}

export function assertValidPassword(password: string): void {
  if (password.length < 8) { // Using literal 8 for clarity, MIN_PASSWORD_LENGTH is 8
    throw new HttpsError(
      'invalid-argument',
      `Password must be at least 8 characters long.`,
    );
  }
}

export function assertValidCreateRole(role: string): void {
  if (!(ALLOWED_CREATE_ROLES as readonly string[]).includes(role)) {
    throw new HttpsError(
      'invalid-argument',
      `Role must be one of: ${ALLOWED_CREATE_ROLES.join(', ')}.`,
    );
  }
}

export function assertNonEmptyId(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpsError('invalid-argument', `${field} must be a non-empty value.`);
  }
}
