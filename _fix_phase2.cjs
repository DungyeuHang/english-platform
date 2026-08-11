const fs = require('fs');

const files = {
  'd:/GitHub/english-platform/src/shared/components/ProtectedRoute.tsx': `import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { LoadingScreen } from '@/shared/components/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'teacher' | 'student'>;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (user.status === 'disabled') {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const roleDashboard: Record<string, string> = {
      admin: '/admin',
      teacher: '/teacher',
      student: '/student',
    };
    return <Navigate to={roleDashboard[user.role]} replace />;
  }

  return <>{children}</>;
}
`,
};

for (const [filePath, content] of Object.entries(files)) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Written:', filePath);
}
