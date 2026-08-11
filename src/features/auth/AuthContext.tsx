import React, { useState, useEffect, useCallback, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseServices } from '@/shared/lib/firebase/client';
import type { UserProfile, UserRole } from '@/shared/utils/types';

export interface AuthUser extends Omit<UserProfile, 'createdAt' | 'updatedAt'> {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  status: 'active' | 'disabled';
  classIds: string[];
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
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const loadUserProfile = useCallback(async (fbUser: FirebaseUser): Promise<AuthUser> => {
    const { firestore } = getFirebaseServices();
    if (!firestore) {
      throw new Error('Firestore not initialized.');
    }

    const snap = await getDoc(doc(firestore, 'users', fbUser.uid));

    if (!snap.exists()) {
      throw new Error('User profile not found. Please contact an administrator.');
    }

    const data = snap.data();
    const role = data.role || 'student';
    const userStatus = data.status || 'active';

    return {
      uid: fbUser.uid,
      email: fbUser.email || '',
      displayName: data.displayName || fbUser.displayName || '',
      photoURL: data.photoURL || fbUser.photoURL,
      role,
      status: userStatus,
      classIds: data.classIds || [],
    };
  }, []);

  const refreshUser = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const profile = await loadUserProfile(firebaseUser);
      setUser(profile);
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  }, [firebaseUser, loadUserProfile]);

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
          const profile = await loadUserProfile(fbUser);
          setUser(profile);
          setStatus('authenticated');
        } catch (err: any) {
          console.error('Failed to load user profile:', err);
          setError(err.message || 'Failed to load user profile. Please try again.');
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
  }, [loadUserProfile]);

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
    <AuthContext.Provider value={{ user, firebaseUser, status, login, logout, error, clearError, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}