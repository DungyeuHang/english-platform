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
exports.removeStudentFromClass = exports.addStudentToClass = exports.deleteUser = exports.createUser = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const service_1 = require("./service");
const membershipHandlers_1 = require("./membershipHandlers");
const userHandlers_1 = require("./userHandlers");
const services = (0, service_1.createDefaultServices)();
function wrap(handler) {
    return (0, https_1.onCall)(async (request) => {
        const ctx = { uid: request.auth?.uid ?? null };
        try {
            return await handler(request.data, ctx, services);
        }
        catch (err) {
            logger.error('Callable function failed:', err);
            if (err instanceof https_1.HttpsError) {
                throw err;
            }
            throw new https_1.HttpsError('internal', 'An unexpected error occurred. Please try again.');
        }
    });
}
/**
 * Admin-only: securely creates a Firebase Authentication user plus its
 * Firestore `users/{uid}` profile.
 */
exports.createUser = wrap(userHandlers_1.createUserHandler);
/**
 * Admin-only: securely deletes a Firebase Authentication user plus all
 * Firestore-owned records (profile, class memberships, teacher assignments).
 */
exports.deleteUser = wrap(userHandlers_1.deleteUserHandler);
/**
 * Admin or assigned teacher: securely adds a student to a class with atomic
 * membership + classIds + studentCount consistency.
 */
exports.addStudentToClass = wrap(membershipHandlers_1.addStudentToClassHandler);
/**
 * Admin or assigned teacher: securely removes a student from a class with
 * atomic membership + classIds + studentCount consistency.
 */
exports.removeStudentFromClass = wrap(membershipHandlers_1.removeStudentFromClassHandler);
