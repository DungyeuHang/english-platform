import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/app/layouts/RootLayout';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { AdminDashboard } from '@/features/admin/pages/AdminDashboard';
import { TeacherDashboard } from '@/features/teacher/pages/TeacherDashboard';
import { StudentDashboard } from '@/features/student/pages/StudentDashboard';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { AppShellLayout } from '@/app/layouts/AppShellLayout';
import { AdminPage } from '@/features/admin/pages/AdminPage';
import { TeacherPage } from '@/features/teacher/pages/TeacherPage';
import { UserManagementPage } from '@/features/admin/pages/UserManagementPage';
import { ClassManagementPage } from '@/features/admin/pages/ClassManagementPage';
// NOTE (Stabilization): Lesson and Assignment features are part of a future phase.
// The routes are temporarily removed to allow the app to build and run correctly.
// import { LessonManagementPage } from '@/features/lesson/pages/LessonManagementPage';
// import { LessonDetailPage } from '@/features/lesson/pages/LessonDetailPage';
// import { QuestionManagementPage } from '@/features/lesson/pages/QuestionManagementPage';
// import { TeacherLessonsPage } from '@/features/lesson/pages/TeacherLessonsPage';
// import { StudentLessonsPage } from '@/features/lesson/pages/StudentLessonsPage';
import { TeacherClassesPage } from '@/features/teacher/pages/TeacherClassesPage';
import { StudentPage } from '@/features/student/pages/StudentPage';
import { HomePage } from '@/features/student/pages/HomePage';
import { GamificationPage } from '@/features/gamification/pages/GamificationPage';
// import { AssignmentManagementPage } from '@/features/assignment/pages/AssignmentManagementPage';
// import { CreateAssignmentPage } from '@/features/assignment/pages/CreateAssignmentPage';
// import { SubmissionsPage } from '@/features/assignment/pages/SubmissionsPage';
// import { GradeSubmissionPage } from '@/features/assignment/pages/GradeSubmissionPage';
// import { StudentAssignmentsPage } from '@/features/assignment/pages/StudentAssignmentsPage';
// import { StudentAssignmentPage } from '@/features/assignment/pages/StudentAssignmentPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'auth',
        element: <LoginPage />,
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AppShellLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'users', element: <UserManagementPage /> }, // Renamed from students/teachers
          { path: 'classes', element: <ClassManagementPage /> },
          // { path: 'lessons', element: <LessonManagementPage /> },
          // { path: 'lessons/:lessonId', element: <LessonDetailPage /> },
          // { path: 'lessons/:lessonId/questions', element: <QuestionManagementPage /> },
          // { path: 'assignments', element: <AssignmentManagementPage /> },
          // { path: 'assignments/create', element: <CreateAssignmentPage /> },
          // { path: 'assignments/:assignmentId/submissions', element: <SubmissionsPage /> },
          // { path: 'assignments/:assignmentId/submissions/:submissionId/grade', element: <GradeSubmissionPage /> },
        ],
      },
      {
        path: 'teacher',
        element: (
          <ProtectedRoute allowedRoles={['teacher']}>
            <AppShellLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <TeacherDashboard /> },
          { path: 'classes', element: <TeacherClassesPage /> },
          // { path: 'lessons', element: <TeacherLessonsPage /> },
          // { path: 'lessons/:lessonId', element: <LessonDetailPage /> },
          // { path: 'lessons/:lessonId/questions', element: <QuestionManagementPage /> },
          // { path: 'assignments', element: <AssignmentManagementPage /> },
          // { path: 'assignments/create', element: <CreateAssignmentPage /> },
          // { path: 'assignments/:assignmentId/submissions', element: <SubmissionsPage /> },
          // { path: 'assignments/:assignmentId/submissions/:submissionId/grade', element: <GradeSubmissionPage /> },
          // { path: 'question-bank', element: <TeacherPage /> }, // Removed as question bank is managed within lessons

        ],
      },
      {
        path: 'student',
        element: (
          <ProtectedRoute allowedRoles={['student']}>
            <AppShellLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <StudentDashboard /> },
          // { path: 'assignments', element: <StudentAssignmentsPage /> },
          // { path: 'assignments/:assignmentId', element: <StudentAssignmentPage /> },
          // { path: 'lessons', element: <StudentLessonsPage /> }, // Student view for lessons
          // { path: 'learning', element: <StudentLessonsPage /> }, // Placeholder for future learning path
          { path: 'progress', element: <StudentPage /> },
          { path: 'achievements', element: <GamificationPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);