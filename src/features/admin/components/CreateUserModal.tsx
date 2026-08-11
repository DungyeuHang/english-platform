import { useState, type FormEvent } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import type { UserRole } from '@/shared/utils/types';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    email: string;
    displayName: string;
    role: UserRole;
    password: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
  submitError?: string | null;
}

export function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  submitError,
}: CreateUserModalProps) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({ email, displayName, role, password });
  };

  const handleClose = () => {
    setEmail('');
    setDisplayName('');
    setRole('student');
    setPassword('');
    onClose();
  };

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-large border border-line bg-surface p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-ink">Create New User</h3>

        {submitError && (
          <div className="mt-4 rounded-card border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input
            id="create-email"
            name="email"
            label="Email *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
            disabled={isSubmitting}
            autoComplete="email"
          />

          <Input
            id="create-name"
            name="displayName"
            label="Full Name *"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Jane Doe"
            required
            disabled={isSubmitting}
          />

          <Input
            id="create-password"
            name="password"
            label="Password *"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="min 6 characters"
            required
            disabled={isSubmitting}
            minLength={6}
          />

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Role *</label>
            <div className="flex gap-3">
              {roleOptions.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    checked={role === opt.value}
                    onChange={() => setRole(opt.value)}
                    disabled={isSubmitting}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-ink">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClose}
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
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}