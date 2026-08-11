import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/student', label: 'Student' },
  { to: '/teacher', label: 'Teacher' },
  { to: '/admin', label: 'Admin' },
  { to: '/gamification', label: 'Gamification' },
] as const;

export function RootLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';

  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <span className="text-lg font-bold text-brand-600">English Platform</span>
          <ul className="flex gap-4">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    isActive
                      ? 'font-medium text-brand-600 underline underline-offset-4'
                      : 'text-ink-soft transition-colors hover:text-brand-600'
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}