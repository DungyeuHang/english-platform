import * as admin from 'firebase-admin';
import type { AdminServices, ClassRecord, Transaction, UserRecord } from './services';

let appInitialized = false;

function getAdmin(): admin.app.App {
  if (!appInitialized) {
    admin.initializeApp();
    appInitialized = true;
  }
  return admin.app();
}

/**
 * Default implementation of AdminServices backed by the Firebase Admin SDK.
 * Runs server-side only (Firebase Cloud Functions). Never used on the client.
 */
export function createDefaultServices(): AdminServices {
  const app = getAdmin();
  const db = admin.firestore(app);
  const auth = admin.auth(app);

  const users = db.collection('users');
  const classes = db.collection('classes');
  const memberships = db.collection('classMemberships');

  return {
    async readUser(uid: string): Promise<UserRecord | null> {
      const snap = await users.doc(uid).get();
      if (!snap.exists) return null;
      const d = snap.data() || {};
      return { role: d.role, status: d.status, classIds: d.classIds || [] };
    },

    async readClass(classId: string): Promise<ClassRecord | null> {
      const snap = await classes.doc(classId).get();
      if (!snap.exists) return null;
      const d = snap.data() || {};
      return { teacherId: d.teacherId ?? null, studentCount: d.studentCount || 0 };
    },

    async runTransaction<T>(fn: (tx: Transaction) => T | Promise<T>): Promise<T> {
      return db.runTransaction(async (t) => {
        const tx: Transaction = {
          async getUser(uid: string): Promise<UserRecord | null> {
            const snap = await t.get(users.doc(uid));
            if (!snap.exists) return null;
            const d = snap.data() || {};
            return { role: d.role, status: d.status, classIds: d.classIds || [] };
          },
          async getClass(classId: string): Promise<ClassRecord | null> {
            const snap = await t.get(classes.doc(classId));
            if (!snap.exists) return null;
            const d = snap.data() || {};
            return { teacherId: d.teacherId ?? null, studentCount: d.studentCount || 0 };
          },
          async getMemberships(classId: string, studentId: string): Promise<string[]> {
            const q = memberships.where('classId', '==', classId).where('studentId', '==', studentId);
            const snap = await t.get(q);
            return snap.docs.map((d) => d.id);
          },
          async getUserMemberships(
            uid: string,
          ): Promise<{ classId: string; membershipId: string }[]> {
            const q = memberships.where('studentId', '==', uid);
            const snap = await t.get(q);
            return snap.docs.map((d) => ({ classId: d.data().classId, membershipId: d.id }));
          },
          setMembership(membershipId: string, classId: string, studentId: string): void {
            t.set(memberships.doc(membershipId), { classId, studentId });
          },
          deleteMembership(membershipId: string): void {
            t.delete(memberships.doc(membershipId));
          },
          updateUserClassIds(uid: string, classIds: string[]): void {
            t.update(users.doc(uid), { classIds });
          },
          updateClassStudentCount(classId: string, count: number): void {
            t.update(classes.doc(classId), { studentCount: count });
          },
        };
        return fn(tx);
      });
    },

    async createAuthUser(p: { email: string; password: string; displayName: string }): Promise<string> {
      const record = await auth.createUser(p);
      return record.uid;
    },

    async setCustomClaims(uid: string, role: string): Promise<void> {
      await auth.setCustomUserClaims(uid, { role });
    },

    async deleteAuthUser(uid: string): Promise<void> {
      await auth.deleteUser(uid);
    },

    async writeUserProfile(
      uid: string,
      p: { email: string; displayName: string; role: string; status: string },
    ): Promise<void> {
      await users.doc(uid).set({
        uid,
        email: p.email,
        displayName: p.displayName,
        role: p.role,
        status: p.status,
        photoURL: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    },

    async deleteUserProfile(uid: string): Promise<void> {
      await users.doc(uid).delete();
    },

    async unassignTeacher(teacherId: string): Promise<number> {
      const snap = await classes.where('teacherId', '==', teacherId).get();
      const batch = db.batch();
      snap.docs.forEach((d) => batch.update(d.ref, { teacherId: null }));
      await batch.commit();
      return snap.size;
    },
  };
}
