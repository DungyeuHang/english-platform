import { useState, useEffect, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { createClass, updateClass } from '@/features/admin/lib/classRepository';
import type { ClassProfile, UserProfile } from '@/shared/utils/types';

interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  classProfile?: ClassProfile | null;
  teachers: UserProfile[];
}

export function ClassFormModal({ isOpen, onClose, classProfile, teachers }: ClassFormModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!classProfile;

  useEffect(() => {
    if (isEditMode && classProfile) {
      setName(classProfile.name);
      setCode(classProfile.code);
      setDescription(classProfile.description || '');
      setTeacherId(classProfile.teacherId || null);
    } else {
      // Reset for create mode
      setName('');
      setCode('');
      setDescription('');
      setTeacherId(null);
    }
  }, [classProfile, isEditMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const classData = { name, code, description, teacherId, status: classProfile?.status || 'active' };

    try {
      if (isEditMode && classProfile) {
        await updateClass(classProfile.id, classData);
        toast.success('Class updated successfully!');
      } else {
        await createClass(classData);
        toast.success('Class created successfully!');
      }
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-large border border-line bg-surface p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-ink">{isEditMode ? 'Edit Class' : 'Create New Class'}</h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input
            label="Class Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <Input
            label="Class Code *"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            disabled={isSubmitting || isEditMode}
            hint={isEditMode ? 'Class code cannot be changed.' : 'Must be unique.'}
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          />
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Assign Teacher</label>
            <select
              value={teacherId || ''}
              onChange={(e) => setTeacherId(e.target.value || null)}
              disabled={isSubmitting}
              className="h-10 w-full rounded-card border border-line bg-surface px-3 text-ink transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">-- Unassigned --</option>
              {teachers.map((teacher) => (
                <option key={teacher.uid} value={teacher.uid}>
                  {teacher.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="flex-1"
              loading={isSubmitting}
            >
              {isSubmitting
                ? isEditMode
                  ? 'Saving...'
                  : 'Creating...'
                : isEditMode
                  ? 'Save Changes'
                  : 'Create Class'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}