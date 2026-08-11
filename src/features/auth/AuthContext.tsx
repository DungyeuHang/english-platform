import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseServices } from '@/shared/lib/firebase/client';
import type { UserRole } from '@/shared/utils/types';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const ROLE_COLLECTION_MAP: Record<UserRole, string> = {
  admin: 'admins',
  teacher: 'teachers',
  student: 'students',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const loadUserRole = useCallback(async (fbUser: FirebaseUser): Promise<UserRole> => {
    const { firestore } = getFirebaseServices();
    if (!firestore) {
      return 'student';
    }

    for (const [role, collectionName] of Object.entries(ROLE_COLLECTION_MAP)) {
      const ref = doc(firestore, collectionName, fbUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return role as UserRole;
      }
    }
    return 'student';
  }, []);

  useEffect(() => {
    const { auth } = getFirebaseServices();

    if (!auth) {
      setStatus('unauthenticated');
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser) => {
        setFirebaseUser(fbUser);

        if (!fbUser) {
          setUser(null);
          setStatus('unauthenticated');
          return;
        }

        try {
          const role = await loadUserRole(fbUser);
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            role,
          });
          setStatus('authenticated');
        } catch (err) {
          console.error('Failed to load user role:', err);
          setError('Failed to load user profile. Please try again.');
          setStatus('unauthenticated');
        }
      },
      (err) => {
        console.error('Auth state change error:', err);
        setError(err.message);
        setStatus('unauthenticated');
      },
    );

    return unsubscribe;
  }, [loadUserRole]);

  const login = useCallback(async (email: string, password: string) => {
    const { auth } = getFirebaseServices();

    if (!auth) {
      setError('Firebase Auth is not configured.');
      return;
    }

    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const message = err?.message || 'Login failed. Please try again.';
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    const { auth } = getFirebaseServices();

    if (!auth) return;

    try {
      await signOut(auth);
    } catch (err: any) {
      setError(err?.message || 'Logout failed.');
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, status, login, logout, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}