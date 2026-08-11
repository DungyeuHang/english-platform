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

export type LessonStatus = 'draft' | 'published' | 'archived';

export interface LessonContent {
  type: 'rich_text';
  body: string;
}

export interface LessonProfile {
  id: string;
  title: string;
  description: string;
  classId: string;
  content: LessonContent;
  order: number;
  status: LessonStatus;
  questionCount?: number; // Denormalized for UI
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  // Denormalized for UI
  className?: string;
  teacherName?: string;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export type QuestionStatus = 'active' | 'archived';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionProfile {
  id: string;
  lessonId: string;
  type: QuestionType;
  question: string;
  options?: QuestionOption[]; // For multiple_choice
  correctAnswer: string; // ID of option for MC, text for T/F/SA
  explanation?: string;
  points: number;
  order: number;
  status: QuestionStatus;
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type AssignmentStatus = 'draft' | 'published' | 'archived';

export interface AssignmentProfile {
  id: string;
  title: string;
  description: string;
  classId: string;
  lessonId: string;
  questionIds: string[]; // Original question IDs from question bank
  dueAt: Date | null;
  status: AssignmentStatus;
  totalPoints: number;
  questionCount?: number; // Denormalized for UI
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  // Denormalized for UI
  className?: string;
  lessonTitle?: string;
  teacherName?: string;
}

export interface AssignmentQuestionSnapshot {
  id: string; // assignmentQuestionId
  assignmentId: string;
  originalQuestionId: string;
  type: QuestionType;
  question: string;
  options?: QuestionOption[];
  points: number;
  order: number;
}

export interface AssignmentAnswerKey {
  id: string; // answerKeyId
  assignmentId: string;
  assignmentQuestionId: string;
  correctAnswer: string;
  explanation?: string;
}

export type SubmissionStatus = 'in_progress' | 'submitted' | 'graded';

export interface SubmissionProfile {
  id: string; // {studentId}_{assignmentId}
  assignmentId: string;
  studentId: string;
  classId: string; // Denormalized for teacher queries
  status: SubmissionStatus;
  startedAt: Date | null;
  submittedAt?: Date | null;
  gradedAt?: Date | null;
  totalPoints: number;
  earnedPoints: number;
  needsManualGrading: boolean;
  gradedBy?: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface SubmissionAnswer {
  id: string; // submissionAnswerId
  submissionId: string;
  assignmentQuestionId: string;
  studentId: string; // Denormalized for rules
  answer: string; // Student's answer
  isCorrect?: boolean;
  pointsEarned?: number;
  feedback?: string;
  gradedAt?: Date | null;
  gradedBy?: string;
}