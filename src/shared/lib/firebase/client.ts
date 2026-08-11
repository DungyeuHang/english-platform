import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { isFirebaseConfigured, readFirebaseEnv } from './env';

/**
 * Lazily initializes the Firebase app and its services.
 *
 * The Firebase app is only created after the environment is confirmed to be
 * configured, so the application still boots (and tests still run) when no
 * Firebase keys are present.
 *
 * Service types are derived from their factories via `ReturnType` so the
 * abstraction does not depend on a specific named type export of the SDK.
 */

type Auth = ReturnType<typeof getAuth>;
type Firestore = ReturnType<typeof getFirestore>;
type Storage = ReturnType<typeof getStorage>;

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;
let storageInstance: Storage | null = null;
let initError: Error | null = null;

export interface FirebaseServices {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: Storage | null;
  error: Error | null;
}

function getFirebaseApp(): FirebaseApp | null {
  if (app) {
    return app;
  }

  const config = readFirebaseEnv();
  if (!isFirebaseConfigured(config)) {
    initError = new Error(
      'Firebase is not configured. Add VITE_FIREBASE_* variables to your .env.local file.',
    );
    return null;
  }

  app = initializeApp(config);
  return app;
}

export function getFirebaseServices(): FirebaseServices {
  const firebaseApp = getFirebaseApp();

  if (!firebaseApp) {
    return { app: null, auth: null, firestore: null, storage: null, error: initError };
  }

  authInstance ??= getAuth(firebaseApp);
  firestoreInstance ??= getFirestore(firebaseApp);
  storageInstance ??= getStorage(firebaseApp);

  return {
    app: firebaseApp,
    auth: authInstance,
    firestore: firestoreInstance,
    storage: storageInstance,
    error: null,
  };
}

export function isFirebaseReady(): boolean {
  return getFirebaseApp() !== null;
}