import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { fetchTeacherClasses } from '@/features/admin/lib/classRepository';
import type { ClassProfile } from '@/shared/utils/types';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { Card } from '@/shared/components/Card';
import { ManageStudentsModal } from '@/features/admin/components/ManageStudentsModal';

export function TeacherClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [classToManage, setClassToManage] = useState<ClassProfile | null>(null);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedClasses = await fetchTeacherClasses(user.uid);
      setClasses(fetchedClasses);
    } catch (err) {
      setError('Failed to load your classes. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCloseModal = () => {
    setClassToManage(null);
    loadData(); // Refresh list on close
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">My Classes</h1>
        <p className="mt-1 text-ink-soft">Manage students in the classes you are assigned to.</p>
      </div>

      {isLoading && (
        <div className="text-center py-10">
          <p className="text-ink-soft">Loading your classes...</p>
        </div>
      )}

      {error && <p className="text-danger">{error}</p>}

      {!isLoading && !error && (
        <>
          {classes.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-line rounded-large">
              <h3 className="text-lg font-semibold text-ink">No Classes Assigned</h3>
              <p className="text-ink-soft mt-1">You have not been assigned to any classes yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((c) => (
                <Card key={c.id} className="flex flex-col">
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-ink text-lg">{c.name}</h3>
                      <Badge variant={c.status === 'active' ? 'success' : 'default'} size="sm" className="capitalize">
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-ink-soft mt-1">{c.code}</p>
                    <p className="text-sm text-ink-soft mt-4">
                      <span className="font-medium text-ink">{c.studentCount}</span> students
                    </p>
                  </div>
                  <div className="mt-6">
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => setClassToManage(c)}
                    >
                      Manage Students
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {classToManage && (
        <ManageStudentsModal isOpen onClose={handleCloseModal} classProfile={classToManage} />
      )}
    </div>
  );
}