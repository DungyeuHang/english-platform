/**
 * Firebase configuration read safely from environment variables.
 *
 * Firebase Web config values are public by design (they are exposed to the
 * browser). They are still kept out of source control via `.env.local` so
 * each environment can point at its own Firebase project and so the config
 * is never mixed into the codebase.
 */

export interface FirebaseConfigInput {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export function readFirebaseEnv(): FirebaseConfigInput {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

export function isFirebaseConfigured(config: FirebaseConfigInput = readFirebaseEnv()): boolean {
  return Boolean(config.apiKey && config.projectId && config.appId);
}