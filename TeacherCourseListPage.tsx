import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { fetchTeacherCourses } from '../lib/courseRepository';
import type { CourseProfile } from '@/shared/utils/types';
import { Button } from '@/shared/components/Button';
import toast from 'react-hot-toast';

export function TeacherCourseListPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    fetchTeacherCourses(user.uid)
      .then(setCourses)
      .catch(() => toast.error('Failed to load courses.'))
      .finally(() => setIsLoading(false));
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">My Courses</h1>
        <Button>Create New Course</Button>
      </div>
      {isLoading ? (
        <p>Loading courses...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="p-4 border rounded-card bg-surface">
              <h3 className="font-semibold">{course.title}</h3>
              <p className="text-sm text-ink-soft">{course.level}</p>
              <span className="text-xs font-mono">{course.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}