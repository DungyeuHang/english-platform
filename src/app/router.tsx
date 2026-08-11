import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/app/layouts/RootLayout';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import { AdminPage } from '@/features/admin/pages/AdminPage';
import { AuthPage } from '@/features/auth/pages/AuthPage';
import { GamificationPage } from '@/features/gamification/pages/GamificationPage';
import { HomePage } from '@/features/student/pages/HomePage';
import { StudentPage } from '@/features/student/pages/StudentPage';
import { TeacherPage } from '@/features/teacher/pages/TeacherPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'auth', element: <AuthPage /> },
      { path: 'student', element: <StudentPage /> },
      { path: 'teacher', element: <TeacherPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'gamification', element: <GamificationPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);