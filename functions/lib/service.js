"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultServices = createDefaultServices;
const admin = __importStar(require("firebase-admin"));
let appInitialized = false;
function getAdmin() {
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
function createDefaultServices() {
    const app = getAdmin();
    const db = admin.firestore(app);
    const auth = admin.auth(app);
    const users = db.collection('users');
    const classes = db.collection('classes');
    const memberships = db.collection('classMemberships');
    return {
        async readUser(uid) {
            const snap = await users.doc(uid).get();
            if (!snap.exists)
                return null;
            const d = snap.data() || {};
            return { role: d.role, status: d.status, classIds: d.classIds || [] };
        },
        async readClass(classId) {
            const snap = await classes.doc(classId).get();
            if (!snap.exists)
                return null;
            const d = snap.data() || {};
            return { teacherId: d.teacherId ?? null, studentCount: d.studentCount || 0 };
        },
        async runTransaction(fn) {
            return db.runTransaction(async (t) => {
                const tx = {
                    async getUser(uid) {
                        const snap = await t.get(users.doc(uid));
                        if (!snap.exists)
                            return null;
                        const d = snap.data() || {};
                        return { role: d.role, status: d.status, classIds: d.classIds || [] };
                    },
                    async getClass(classId) {
                        const snap = await t.get(classes.doc(classId));
                        if (!snap.exists)
                            return null;
                        const d = snap.data() || {};
                        return { teacherId: d.teacherId ?? null, studentCount: d.studentCount || 0 };
                    },
                    async getMemberships(classId, studentId) {
                        const q = memberships.where('classId', '==', classId).where('studentId', '==', studentId);
                        const snap = await t.get(q);
                        return snap.docs.map((d) => d.id);
                    },
                    async getUserMemberships(uid) {
                        const q = memberships.where('studentId', '==', uid);
                        const snap = await t.get(q);
                        return snap.docs.map((d) => ({ classId: d.data().classId, membershipId: d.id }));
                    },
                    setMembership(membershipId, classId, studentId) {
                        t.set(memberships.doc(membershipId), { classId, studentId });
                    },
                    deleteMembership(membershipId) {
                        t.delete(memberships.doc(membershipId));
                    },
                    updateUserClassIds(uid, classIds) {
                        t.update(users.doc(uid), { classIds });
                    },
                    updateClassStudentCount(classId, count) {
                        t.update(classes.doc(classId), { studentCount: count });
                    },
                };
                return fn(tx);
            });
        },
        async createAuthUser(p) {
            const record = await auth.createUser(p);
            return record.uid;
        },
        async setCustomClaims(uid, role) {
            await auth.setCustomUserClaims(uid, { role });
        },
        async deleteAuthUser(uid) {
            await auth.deleteUser(uid);
        },
        async writeUserProfile(uid, p) {
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
        async deleteUserProfile(uid) {
            await users.doc(uid).delete();
        },
        async unassignTeacher(teacherId) {
            const snap = await classes.where('teacherId', '==', teacherId).get();
            const batch = db.batch();
            snap.docs.forEach((d) => batch.update(d.ref, { teacherId: null }));
            await batch.commit();
            return snap.size;
        },
    };
}
