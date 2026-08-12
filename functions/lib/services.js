"use strict";
/**
 * Dependency abstraction for the callable-function handlers.
 *
 * The handlers contain all real business logic (authz, input validation,
 * cleanup ordering, compensating error handling). Only the low-level
 * Firebase Auth / Firestore I/O is abstracted behind this small interface so
 * the handlers can be unit-tested without instantiating the real Admin SDK,
 * while still exercising meaningful logic.
 */
Object.defineProperty(exports, "__esModule", { value: true });
