import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Avatar } from '@/shared/components/Avatar';
import { Button } from '@/shared/components/Button';
import { Toaster } from 'react-hot-toast';

const adminNavItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Users' },
  // { to: '/admin/teachers', label: 'Teachers' },
  { to: '/admin/classes', label: 'Classes' },
];

const teacherNavItems = [
  { to: '/teacher', label: 'Dashboard', end: true },
  { to: '/teacher/classes', label: 'Classes' },
  { to: '/teacher/lessons', label: 'Lessons' },
  { to: '/teacher/question-bank', label: 'Question Bank' },
  { to: '/teacher/assignments', label: 'Assignments' },
];

const studentNavItems = [
  { to: '/student', label: 'Home', end: true },
  { to: '/student/assignments', label: 'My Assignments' },
  { to: '/student/learning', label: 'Learning' },
  { to: '/student/progress', label: 'Progress' },
  { to: '/student/achievements', label: 'Achievements' },
];

export function AppShellLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getNavItems = () => {
    switch (user?.role) {
      case 'admin':
        return adminNavItems;
      case 'teacher':
        return teacherNavItems;
      case 'student':
        return studentNavItems;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="flex min-h-screen bg-paper">
        {/* Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex flex-col flex-1 border-r border-line bg-surface">
            <div className="flex items-center h-16 px-6 border-b border-line">
              <span className="text-lg font-bold text-brand-600">English Platform</span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `block rounded-card px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-soft hover:bg-surface hover:text-ink'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="p-4 border-t border-line">
              <div className="flex items-center gap-3">
                <Avatar src={user?.photoURL} name={user?.displayName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-ink-soft capitalize">{user?.role}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full mt-3"
              >
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 md:pl-64">
          <div className="flex flex-col flex-1">
            {/* Mobile header */}
            <header className="flex items-center justify-between h-16 px-4 border-b border-line bg-surface md:hidden">
              <span className="text-lg font-bold text-brand-600">English Platform</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </header>

            {/* Page content */}
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </>
  );
}