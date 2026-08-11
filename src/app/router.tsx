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
import { StudentPage } from '@/features/student/pages/StudentPage';
import { HomePage } from '@/features/student/pages/HomePage';
import { GamificationPage } from '@/features/gamification/pages/GamificationPage';

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
          { path: 'students', element: <AdminPage /> },
          { path: 'teachers', element: <AdminPage /> },
          { path: 'classes', element: <AdminPage /> },
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
          { path: 'classes', element: <TeacherPage /> },
          { path: 'lessons', element: <TeacherPage /> },
          { path: 'question-bank', element: <TeacherPage /> },
          { path: 'assignments', element: <TeacherPage /> },
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
          { path: 'assignments', element: <StudentPage /> },
          { path: 'learning', element: <StudentPage /> },
          { path: 'progress', element: <StudentPage /> },
          { path: 'achievements', element: <GamificationPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);