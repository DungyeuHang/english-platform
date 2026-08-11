export type UserRole = 'admin' | 'teacher' | 'student';

export type UserStatus = 'active' | 'disabled';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  status: UserStatus;
  photoURL: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
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