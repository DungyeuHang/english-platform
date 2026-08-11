import { Card, Badge } from '@/shared/components';

const mockStudents = [
  { id: '1', name: 'Alice Nguyen', email: 'alice@example.com', class: 'EN101', xp: 2450, level: 12, streak: 7 },
  { id: '2', name: 'Bob Tran', email: 'bob@example.com', class: 'EN102', xp: 1890, level: 9, streak: 3 },
  { id: '3', name: 'Carol Le', email: 'carol@example.com', class: 'EN101', xp: 3200, level: 16, streak: 14 },
];

const mockClasses = [
  { id: '1', name: 'EN101 - Beginner', students: 15, teacher: 'Dr. Sarah Wilson', progress: 65 },
  { id: '2', name: 'EN102 - Intermediate', students: 12, teacher: 'Mr. James Smith', progress: 45 },
  { id: '3', name: 'EN201 - Advanced', students: 8, teacher: 'Dr. Sarah Wilson', progress: 30 },
];

export function AdminDashboard() {
  const stats = [
    { label: 'Total Students', value: '45', trend: '+5 this month' },
    { label: 'Total Teachers', value: '8', trend: '2 pending' },
    { label: 'Active Classes', value: '12', trend: '3 starting soon' },
    { label: 'Completion Rate', value: '78%', trend: '+5% vs last month' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">Dashboard</h1>
        <p className="mt-1 text-ink-soft">Welcome back, Administrator</p>
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
            <h3 className="text-lg font-semibold text-ink">Recent Students</h3>
            <Badge variant="info">{mockStudents.length} total</Badge>
          </div>
          <div className="space-y-3">
            {mockStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 rounded-card bg-paper">
                <div>
                  <p className="font-medium text-ink">{student.name}</p>
                  <p className="text-sm text-ink-soft">{student.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-ink">Lvl {student.level}</p>
                  <p className="text-xs text-ink-soft">{student.xp} XP</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-ink">Classes</h3>
            <Badge variant="success">{mockClasses.length} active</Badge>
          </div>
          <div className="space-y-3">
            {mockClasses.map((cls) => (
              <div key={cls.id} className="p-3 rounded-card bg-paper">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-ink">{cls.name}</p>
                  <span className="text-xs text-ink-soft">{cls.students} students</span>
                </div>
                <p className="text-sm text-ink-soft mb-2">{cls.teacher}</p>
                <div className="w-full bg-line rounded-full h-2">
                  <div
                    className="bg-brand-600 h-2 rounded-full"
                    style={{ width: `${cls.progress}%` }}
                  />
                </div>
                <p className="text-xs text-ink-soft mt-1">{cls.progress}% progress</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}