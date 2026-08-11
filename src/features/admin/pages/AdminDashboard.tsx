import { Card, Badge } from '@/shared/components';
import { useState, useEffect } from 'react';
import { getUserStats } from '@/features/admin/lib/userRepository';
import { fetchClasses } from '@/features/admin/lib/classRepository';
import type { UserProfile } from '@/shared/utils/types';
import type { ClassProfile } from '@/shared/utils/types';

export function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, byRole: { student: 0, teacher: 0, admin: 0 } });
  const [recentClasses, setRecentClasses] = useState<ClassProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [userStats, allClasses] = await Promise.all([
          getUserStats(),
          fetchClasses(),
        ]);
        setStats({ total: userStats.total, byRole: userStats.byRole });
        setRecentClasses(allClasses.slice(0, 5));
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const statCards = [
    { label: 'Total Students', value: stats.byRole.student, trend: '' },
    { label: 'Total Teachers', value: stats.byRole.teacher, trend: '' },
    { label: 'Active Classes', value: recentClasses.length, trend: '' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">Dashboard</h1>
        <p className="mt-1 text-ink-soft">Welcome back, Administrator</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-ink-soft">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-ink">{stat.value}</p>
            {stat.trend && <p className="mt-1 text-xs text-success">{stat.trend}</p>}
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-ink">Recently Added Classes</h3>
            <Badge variant="success">{recentClasses.length} shown</Badge>
          </div>
          <div className="space-y-3">
            {isLoading ? <p>Loading...</p> : recentClasses.map((cls) => (
              <div key={cls.id} className="p-3 rounded-card bg-paper">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-ink">{cls.name}</p>
                  <span className="text-xs text-ink-soft">{cls.studentCount} students</span>
                </div>
                <p className="text-sm text-ink-soft mb-2">
                  Teacher: {cls.teacher ? cls.teacher.displayName : 'Unassigned'}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}