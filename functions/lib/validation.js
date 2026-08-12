"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_CREATE_ROLES = exports.MIN_PASSWORD_LENGTH = void 0;
exports.requireAuth = requireAuth;
exports.requireActiveAdmin = requireActiveAdmin;
exports.assertString = assertString;
exports.assertValidEmail = assertValidEmail;
exports.assertValidPassword = assertValidPassword;
exports.assertValidCreateRole = assertValidCreateRole;
exports.assertNonEmptyId = assertNonEmptyId;
const https_1 = require("firebase-functions/v2/https");
exports.MIN_PASSWORD_LENGTH = 8;
exports.ALLOWED_CREATE_ROLES = ['student', 'teacher'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function requireAuth(ctx) {
    if (!ctx.uid) {
        throw new https_1.HttpsError('unauthenticated', 'You must be signed in to perform this action.');
    }
    return ctx.uid;
}
/** Returns the caller's user record or throws if it does not describe a valid active admin. */
async function requireActiveAdmin(svc, uid) {
    const caller = await svc.readUser(uid);
    if (!caller || caller.role !== 'admin' || caller.status === 'disabled') {
        throw new https_1.HttpsError('permission-denied', 'You do not have permission to perform this action.');
    }
    return caller;
}
function assertString(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new https_1.HttpsError('invalid-argument', `${field} is required.`);
    }
    return value.trim();
}
function assertValidEmail(email) {
    if (!EMAIL_RE.test(email)) {
        throw new https_1.HttpsError('invalid-argument', 'Please provide a valid email address.');
    }
}
function assertValidPassword(password) {
    if (password.length < exports.MIN_PASSWORD_LENGTH) {
        throw new https_1.HttpsError('invalid-argument', `Password must be at least ${exports.MIN_PASSWORD_LENGTH} characters long.`);
    }
}
function assertValidCreateRole(role) {
    if (!exports.ALLOWED_CREATE_ROLES.includes(role)) {
        throw new https_1.HttpsError('invalid-argument', `Role must be one of: ${exports.ALLOWED_CREATE_ROLES.join(', ')}.`);
    }
}
function assertNonEmptyId(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new https_1.HttpsError('invalid-argument', `${field} must be a non-empty value.`);
    }
}
