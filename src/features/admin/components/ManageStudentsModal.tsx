import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Avatar } from '@/shared/components/Avatar';
import { ConfirmationDialog } from '@/shared/components/ConfirmationDialog';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { fetchUsers } from '@/features/admin/lib/userRepository';
import { fetchClassMembers, addStudentToClass, removeStudentFromClass } from '@/features/admin/lib/classRepository';
import type { ClassProfile, UserProfile } from '@/shared/utils/types';

interface ManageStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  classProfile: ClassProfile;
}

export function ManageStudentsModal({ isOpen, onClose, classProfile }: ManageStudentsModalProps) {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [potentialStudents, setPotentialStudents] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentToRemove, setStudentToRemove] = useState<UserProfile | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // To avoid fetching all students when the search is empty, we conditionally search.
      const memberFetchPromise = fetchClassMembers(classProfile.id);
      const studentSearchPromise = debouncedSearchTerm
        ? fetchUsers({ role: 'student', searchTerm: debouncedSearchTerm })
        : Promise.resolve([]); // Return no students if search term is empty

      const [classMembers, allStudents] = await Promise.all([memberFetchPromise, studentSearchPromise]);

      setMembers(classMembers);
      const memberIds = new Set(classMembers.map(m => m.uid));
      setPotentialStudents(allStudents.filter(s => !memberIds.has(s.uid)));
    } catch (error) {
      toast.error('Failed to load student data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, debouncedSearchTerm, classProfile.id]);

  if (!isOpen) return null;

  const handleAddStudent = async (studentId: string) => {
    try {
      await addStudentToClass(classProfile.id, studentId);
      toast.success('Student added to class.');
      // Refresh data to show the new student in the member list
      // and remove them from the potential students list, without clearing the search.
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add student.');
    }
  };

  const handleConfirmRemove = async () => {
    if (!studentToRemove) return;
    try {
      await removeStudentFromClass(classProfile.id, studentToRemove.uid);
      toast.success('Student removed from class.');
      setStudentToRemove(null);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove student.');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-2xl rounded-large border border-line bg-surface p-6 shadow-xl max-h-[80vh] flex flex-col">
          <div className="flex-shrink-0">
            <h3 className="text-lg font-semibold text-ink">Manage Students in "{classProfile.name}"</h3>
            <p className="text-sm text-ink-soft">Add or remove students from this class.</p>
          </div>

          <div className="flex-grow overflow-y-auto mt-4 pr-2 space-y-6">
            {/* Add Student Section */}
            <div>
              <Input
                placeholder="Search for students to add..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {isLoading && debouncedSearchTerm && <p className="text-sm text-ink-soft mt-2">Searching...</p>}
              {potentialStudents.length > 0 && (
                <ul className="mt-2 border border-line rounded-card max-h-48 overflow-y-auto">
                  {potentialStudents.map(student => (
                    <li key={student.uid} className="flex items-center justify-between p-2 border-b border-line last:border-b-0">
                      <div className="flex items-center gap-2">
                        <Avatar name={student.displayName} size="sm" />
                        <span>{student.displayName} ({student.email})</span>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => handleAddStudent(student.uid)}>Add</Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Current Members Section */}
            <div>
              <h4 className="font-semibold text-ink mb-2">Current Students ({members.length})</h4>
              {isLoading && !debouncedSearchTerm ? <p className="text-sm text-ink-soft">Loading students...</p> :
                members.length === 0 ? <p className="text-sm text-ink-soft p-4 text-center bg-paper rounded-card">This class has no students yet.</p> : (
                  <ul className="border border-line rounded-card">
                    {members.map(student => (
                      <li key={student.uid} className="flex items-center justify-between p-2 border-b border-line last:border-b-0">
                        <div className="flex items-center gap-2">
                          <Avatar name={student.displayName} size="sm" />
                          <span>{student.displayName} ({student.email})</span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setStudentToRemove(student)}>Remove</Button>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          </div>

          <div className="mt-6 flex-shrink-0">
            <Button variant="secondary" onClick={onClose} className="w-full">Close</Button>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={!!studentToRemove}
        onClose={() => setStudentToRemove(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Student"
        message={`Are you sure you want to remove ${studentToRemove?.displayName} from this class? This will not delete the user account.`}
        confirmLabel="Remove"
        variant="danger"
      />
    </>
  );
}