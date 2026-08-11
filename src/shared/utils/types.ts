export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
}

export interface StudentProfile {
  uid: string;
  email: string;
  displayName: string | null;
  role: 'student';
  classIds: string[];
  xp: number;
  level: number;
  streak: number;
  avatar?: string;
}

export interface TeacherProfile {
  uid: string;
  email: string;
  displayName: string | null;
  role: 'teacher';
  specialization?: string;
  bio?: string;
}

export interface AdminProfile {
  uid: string;
  email: string;
  displayName: string | null;
  role: 'admin';
  centerId?: string;
}