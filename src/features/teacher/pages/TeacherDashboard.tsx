import { Card, Badge } from '@/shared/components';

const mockClasses = [
  { id: '1', name: 'EN101 - Beginner', students: 15, progress: 65, nextLesson: 'Present Simple' },
  { id: '2', name: 'EN201 - Advanced', students: 8, progress: 30, nextLesson: 'Conditional Sentences' },
];

const mockAssignments = [
  { id: '1', title: 'Grammar Quiz #3', class: 'EN101', submissions: 12, dueDate: '2024-12-20' },
  { id: '2', title: 'Vocabulary Practice', class: 'EN201', submissions: 5, dueDate: '2024-12-22' },
];

export function TeacherDashboard() {
  const stats = [
    { label: 'My Classes', value: '2', trend: '8 students total' },
    { label: 'Active Lessons', value: '14', trend: '3 in progress' },
    { label: 'Questions', value: '245', trend: '18 new this week' },
    { label: 'Submissions', value: '87', trend: '23 pending' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">Dashboard</h1>
        <p className="mt-1 text-ink-soft">Welcome back, Teacher</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-ink-soft">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-ink">{stat.value}</p>
            <p className="mt-1 text-xs text-success">{stat.trend}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-ink">My Classes</h3>
            <Badge variant="info">{mockClasses.length} total</Badge>
          </div>
          <div className="space-y-3">
            {mockClasses.map((cls) => (
              <div key={cls.id} className="p-4 rounded-card bg-paper">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-ink">{cls.name}</p>
                  <span className="text-sm text-ink-soft">{cls.students} students</span>
                </div>
                <p className="text-sm text-ink-soft mb-3">Next: {cls.nextLesson}</p>
                <div className="w-full bg-line rounded-full h-2">
                  <div
                    className="bg-brand-600 h-2 rounded-full"
                    style={{ width: `${cls.progress}%` }}
                  />
                </div>
                <p className="text-xs text-ink-soft mt-1">{cls.progress}% complete</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-ink">Recent Assignments</h3>
            <Badge variant="warning">{mockAssignments.reduce((a, b) => a + b.submissions, 0)} submissions</Badge>
          </div>
          <div className="space-y-3">
            {mockAssignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-3 rounded-card bg-paper">
                <div>
                  <p className="font-medium text-ink">{assignment.title}</p>
                  <p className="text-sm text-ink-soft">{assignment.class}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-ink">{assignment.submissions} submitted</p>
                  <p className="text-xs text-ink-soft">Due: {assignment.dueDate}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}