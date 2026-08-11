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
  classIds?: string[];
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

export type ClassStatus = 'active' | 'archived';

export interface ClassProfile {
  id: string;
  name: string;
  code: string;
  description: string | null;
  teacherId: string | null;
  status: ClassStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
  // Denormalized/computed fields for UI
  studentCount?: number;
  teacher?: UserProfile | null;
}

export interface ClassMembership {
  id: string;
  classId: string;
  studentId: string;
  joinedAt: Date | null;
}