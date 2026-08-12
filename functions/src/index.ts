import { HttpsError, onCall } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import type { AuthContext } from './services';
import { createDefaultServices } from './service';
import { addStudentToClassHandler, removeStudentFromClassHandler } from './membershipHandlers';
import { createUserHandler, deleteUserHandler } from './userHandlers';

const services = createDefaultServices();

type Handler<D = unknown, R = unknown> = (
  data: D,
  ctx: AuthContext,
  svc: typeof services,
) => Promise<R>;

function wrap(handler: Handler): ReturnType<typeof onCall> {
  return onCall(async (request) => {
    const ctx: AuthContext = { uid: request.auth?.uid ?? null };
    try {
      return await handler(request.data, ctx, services);
    } catch (err) {
      logger.error('Callable function failed:', err);
      if (err instanceof HttpsError) {
        throw err;
      }
      throw new HttpsError('internal', 'An unexpected error occurred. Please try again.');
    }
  });
}

/**
 * Admin-only: securely creates a Firebase Authentication user plus its
 * Firestore `users/{uid}` profile.
 */
export const createUser = wrap(createUserHandler);

/**
 * Admin-only: securely deletes a Firebase Authentication user plus all
 * Firestore-owned records (profile, class memberships, teacher assignments).
 */
export const deleteUser = wrap(deleteUserHandler);

/**
 * Admin or assigned teacher: securely adds a student to a class with atomic
 * membership + classIds + studentCount consistency.
 */
export const addStudentToClass = wrap(addStudentToClassHandler);

/**
 * Admin or assigned teacher: securely removes a student from a class with
 * atomic membership + classIds + studentCount consistency.
 */
export const removeStudentFromClass = wrap(removeStudentFromClassHandler);
