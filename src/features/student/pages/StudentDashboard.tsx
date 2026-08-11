import { Card, Badge, Avatar } from '@/shared/components';

const mockAssignments = [
  { id: '1', title: 'Grammar Quiz #3', subject: 'Grammar', dueDate: '2024-12-20', progress: 75, status: 'in-progress' as const },
  { id: '2', title: 'Vocabulary Practice', subject: 'Vocabulary', dueDate: '2024-12-22', progress: 0, status: 'not-started' as const },
  { id: '3', title: 'Reading Comprehension', subject: 'Reading', dueDate: '2024-12-18', progress: 100, status: 'completed' as const },
];

const recentActivity = [
  { id: '1', title: 'Completed "Present Simple" lesson', timestamp: '2 hours ago', xp: '+50' },
  { id: '2', title: 'Finished Quiz #2 with 8/10', timestamp: '5 hours ago', xp: '+100' },
  { id: '3', title: 'Earned "Streak Master" badge', timestamp: '1 day ago', xp: '+200' },
];

export function StudentDashboard() {
  const stats = [
    { label: 'XP', value: '2,450', icon: '⭐', color: 'text-gold-500' },
    { label: 'Level', value: '12', icon: '🎯', color: 'text-brand-600' },
    { label: 'Streak', value: '7 days', icon: '🔥', color: 'text-danger' },
    { label: 'Completed', value: '34%', icon: '📊', color: 'text-success' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">Welcome back! 👋</h1>
        <p className="mt-1 text-ink-soft">Continue your learning journey</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className={`text-3xl ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-sm text-ink-soft">{stat.label}</p>
              <p className="text-2xl font-bold text-ink">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Assignments */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-ink">My Assignments</h3>
              <Badge variant="info">{mockAssignments.length} active</Badge>
            </div>
            <div className="space-y-3">
              {mockAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-4 rounded-card bg-paper hover:bg-paper/80 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-ink">{assignment.title}</p>
                      <p className="text-sm text-ink-soft">{assignment.subject}</p>
                    </div>
                    <Badge
                      variant={
                        assignment.status === 'completed'
                          ? 'success'
                          : assignment.status === 'in-progress'
                            ? 'info'
                            : 'warning'
                      }
                    >
                      {assignment.status === 'completed'
                        ? 'Completed'
                        : assignment.status === 'in-progress'
                          ? 'In Progress'
                          : 'Not Started'}
                    </Badge>
                  </div>
                  <div className="w-full bg-line rounded-full h-2 mt-3">
                    <div
                      className="bg-brand-600 h-2 rounded-full transition-all"
                      style={{ width: `${assignment.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-ink-soft mt-1">
                    {assignment.progress}% complete · Due: {assignment.dueDate}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <h3 className="text-lg font-semibold text-ink mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <Avatar name="Student" size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink">{activity.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-ink-soft">{activity.timestamp}</p>
                      <span className="text-xs font-medium text-success">{activity.xp} XP</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}