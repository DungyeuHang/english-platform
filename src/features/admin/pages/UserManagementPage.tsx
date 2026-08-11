import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
  fetchUsers,
  updateUserRole,
  updateUserStatus,
  deleteUserDocument,
} from '@/features/admin/lib/userRepository';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseServices } from '@/shared/lib/firebase/client';
import { createUserProfile } from '@/features/admin/lib/userRepository';
import type { UserProfile, UserRole, UserStatus } from '@/shared/utils/types';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Badge } from '@/shared/components/Badge';
import { Avatar } from '@/shared/components/Avatar';
import { CreateUserModal } from '@/features/admin/components/CreateUserModal';
import { ConfirmationDialog } from '@/shared/components/ConfirmationDialog';
import { useAuth } from '@/features/auth/AuthContext';

export function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedUsers = await fetchUsers({
        searchTerm: debouncedSearchTerm,
        role: roleFilter,
        status: statusFilter,
      });
      // Exclude current admin from the list
      setUsers(fetchedUsers.filter((u) => u.uid !== currentUser?.uid));
    } catch (err) {
      setError('Failed to load users. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [debouncedSearchTerm, roleFilter, statusFilter, currentUser]);

  const handleCreateUser = async (data: {
    email: string;
    displayName: string;
    role: UserRole;
    password: string;
  }) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { auth } = getFirebaseServices();
      if (!auth) throw new Error('Firebase Auth chưa được khởi tạo.');

      // RỦI RO BẢO MẬT NGHIÊM TRỌNG: Việc tạo người dùng từ client (trình duyệt) là cực kỳ nguy hiểm,
      // ngay cả khi chỉ dành cho admin. Điều này yêu cầu bật quyền tạo người dùng trong Firebase Auth,
      // mở ra lỗ hổng cho kẻ xấu có thể lạm dụng để tạo tài khoản tùy ý.
      // GIẢI PHÁP ĐÚNG: Chức năng này PHẢI được chuyển sang một môi trường backend an toàn
      // (ví dụ: Firebase Cloud Function) và được gọi một cách an toàn từ client.
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await createUserProfile({
        uid: userCredential.user.uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
      });
      setCreateModalOpen(false);
      loadUsers(); // Refresh list
      toast.success('User created successfully!');
    } catch (err: any) {
      setSubmitError(err.message || 'Không thể tạo người dùng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      // CẢNH BÁO BẢO MẬT: Thao tác này chỉ xóa tài liệu người dùng trong Firestore.
      // Nó KHÔNG xóa người dùng khỏi Firebase Authentication, để lại một tài khoản "mồ côi".
      // Việc xóa người dùng Auth cũng PHẢI được thực hiện từ một backend đáng tin cậy (ví dụ: Cloud Function).
      await deleteUserDocument(userToDelete.uid);
      toast.success('User document deleted. Auth user may still exist.');
      setUserToDelete(null);
      loadUsers(); // Refresh list
    } catch (err) {
      toast.error('Failed to delete user document.');
      console.error(err);
    }
  };

  const handleStatusChange = async (uid: string, newStatus: UserStatus) => {
    try {
      await updateUserStatus(uid, newStatus);
      toast.success(`User status updated to ${newStatus}.`);
      loadUsers();
    } catch (error) {
      toast.error('Failed to update user status.');
      console.error(error);
    }
  };

  const roleBadges: Record<UserRole, 'info' | 'success' | 'warning' | 'danger'> = {
    admin: 'danger',
    teacher: 'info',
    student: 'success',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">User Management</h1>
          <p className="mt-1 text-ink-soft">Manage all users in the system.</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>Add User</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
          className="h-10 w-full rounded-card border border-line bg-surface px-3 text-ink transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="all">All Roles</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
          className="h-10 w-full rounded-card border border-line bg-surface px-3 text-ink transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {isLoading && <p>Loading users...</p>}
      {error && <p className="text-danger">{error}</p>}

      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-card border border-line bg-surface">
          <table className="min-w-full divide-y divide-line">
            <thead className="bg-paper">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-soft uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-soft uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-soft uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-soft uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((user) => (
                <tr key={user.uid}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.photoURL} name={user.displayName} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-ink">{user.displayName}</p>
                        <p className="text-sm text-ink-soft">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={roleBadges[user.role]} size="sm" className="capitalize">{user.role}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={user.status === 'active' ? 'success' : 'warning'} size="sm" className="capitalize">{user.status}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleStatusChange(user.uid, user.status === 'active' ? 'disabled' : 'active')}>
                      {user.status === 'active' ? 'Disable' : 'Enable'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setUserToDelete(user)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateUser}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />

      <ConfirmationDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.displayName}? This action is irreversible.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
