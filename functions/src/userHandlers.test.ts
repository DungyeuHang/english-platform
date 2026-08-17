import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpsError } from 'firebase-functions/v2/https';
import { mock, mockDeep } from 'vitest-mock-extended';
import type { AdminServices, AuthContext } from './services';
import { createUserHandler, deleteUserHandler } from './userHandlers';

const mockServices = mockDeep<AdminServices>();

describe('createUserHandler', () => {
  const validData = {
    email: 'test@example.com',
    password: 'password123',
    displayName: 'Test User',
    role: 'student',
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  const testPermissionDenied = async (ctx: AuthContext, userProfile: any) => {
    if (ctx.uid) {
      mockServices.readUser.calledWith(ctx.uid).mockResolvedValue(userProfile);
    }
    await expect(createUserHandler(validData, ctx, mockServices)).rejects.toThrow(
      new HttpsError('permission-denied', 'You do not have permission to create users.'),
    );
  };

  it('should deny unauthenticated users', async () => {
    await testPermissionDenied({ uid: null }, null);
  });

  it('should deny non-admin users (student)', async () => {
    await testPermissionDenied({ uid: 'student1' }, { role: 'student', status: 'active' });
  });

  it('should deny non-admin users (teacher)', async () => {
    await testPermissionDenied({ uid: 'teacher1' }, { role: 'teacher', status: 'active' });
  });

  it('should deny disabled admins', async () => {
    await testPermissionDenied({ uid: 'admin1' }, { role: 'admin', status: 'disabled' });
  });

  it('should deny invalid email', async () => {
    const ctx = { uid: 'admin1' };
    mockServices.readUser.calledWith('admin1').mockResolvedValue({ role: 'admin', status: 'active' });
    await expect(createUserHandler({ ...validData, email: 'invalid' }, ctx, mockServices)).rejects.toThrow(
      new HttpsError('invalid-argument', 'Invalid email format.'),
    );
  });

  it('should deny short password', async () => {
    const ctx = { uid: 'admin1' };
    mockServices.readUser.calledWith('admin1').mockResolvedValue({ role: 'admin', status: 'active' });
    await expect(createUserHandler({ ...validData, password: '123' }, ctx, mockServices)).rejects.toThrow(
      new HttpsError('invalid-argument', 'Password must be at least 6 characters long.'),
    );
  });

  it('should deny creating an admin', async () => {
    const ctx = { uid: 'admin1' };
    mockServices.readUser.calledWith('admin1').mockResolvedValue({ role: 'admin', status: 'active' });
    await expect(createUserHandler({ ...validData, role: 'admin' }, ctx, mockServices)).rejects.toThrow(
      new HttpsError('invalid-argument', 'Cannot create users with role: admin'),
    );
  });

  it('should throw if email already exists', async () => {
    const ctx = { uid: 'admin1' };
    mockServices.readUser.calledWith('admin1').mockResolvedValue({ role: 'admin', status: 'active' });
    mockServices.createAuthUser.mockRejectedValue({ code: 'auth/email-already-exists' });

    await expect(createUserHandler(validData, ctx, mockServices)).rejects.toThrow(
      new HttpsError('already-exists', `A user with the email ${validData.email} already exists.`),
    );
  });

  it('should roll back Auth user creation if Firestore write fails', async () => {
    const ctx = { uid: 'admin1' };
    const newUid = 'newUser123';
    mockServices.readUser.calledWith('admin1').mockResolvedValue({ role: 'admin', status: 'active' });
    mockServices.createAuthUser.mockResolvedValue(newUid);
    mockServices.setCustomClaims.mockResolvedValue(undefined); // claims succeed
    mockServices.writeUserProfile.mockRejectedValue(new Error('Firestore unavailable')); // profile fails

    await expect(createUserHandler(validData, ctx, mockServices)).rejects.toThrow(
      'Failed to finalize the user profile. The account was rolled back.',
    );

    expect(mockServices.deleteAuthUser).toHaveBeenCalledWith(newUid);
  });

  it('should successfully create a user as an admin', async () => {
    const ctx = { uid: 'admin1' };
    const newUid = 'newUser123';
    mockServices.readUser.calledWith('admin1').mockResolvedValue({ role: 'admin', status: 'active' });
    mockServices.createAuthUser.mockResolvedValue(newUid);
    mockServices.setCustomClaims.mockResolvedValue(undefined);
    mockServices.writeUserProfile.mockResolvedValue(undefined);

    const result = await createUserHandler(validData, ctx, mockServices);

    expect(result.success).toBe(true);
    expect(result.uid).toBe(newUid);
    expect(mockServices.createAuthUser).toHaveBeenCalledWith({
      email: validData.email,
      password: validData.password,
      displayName: validData.displayName,
    });
    expect(mockServices.setCustomClaims).toHaveBeenCalledWith(newUid, validData.role);
    expect(mockServices.writeUserProfile).toHaveBeenCalledWith(newUid, {
      email: validData.email,
      displayName: validData.displayName,
      role: validData.role,
      status: 'active',
    });
  });
});

describe('deleteUserHandler', () => {
  const adminCtx = { uid: 'admin1' };
  const targetUid = 'userToDelete1';
  const deleteData = { uid: targetUid };

  beforeEach(() => {
    vi.resetAllMocks();
    mockServices.readUser.calledWith(adminCtx.uid).mockResolvedValue({ role: 'admin', status: 'active' });
  });

  const testPermissionDenied = async (ctx: AuthContext, userProfile: any) => {
    if (ctx.uid) {
      mockServices.readUser.calledWith(ctx.uid).mockResolvedValue(userProfile);
    }
    await expect(deleteUserHandler(deleteData, ctx, mockServices)).rejects.toThrow(
      new HttpsError('permission-denied', 'You do not have permission to delete users.'),
    );
  };

  it('should deny unauthenticated users', async () => {
    await testPermissionDenied({ uid: null }, null);
  });

  it('should deny non-admin users', async () => {
    await testPermissionDenied({ uid: 'teacher1' }, { role: 'teacher', status: 'active' });
  });

  it('should deny disabled admins', async () => {
    await testPermissionDenied({ uid: 'admin1' }, { role: 'admin', status: 'disabled' });
  });

  it('should deny an admin from deleting their own account', async () => {
    await expect(deleteUserHandler({ uid: adminCtx.uid }, adminCtx, mockServices)).rejects.toThrow(
      new HttpsError('failed-precondition', 'You cannot delete your own account.'),
    );
  });

  it('should handle trying to delete a non-existent user', async () => {
    mockServices.readUser.calledWith(targetUid).mockResolvedValue(null);
    await expect(deleteUserHandler(deleteData, adminCtx, mockServices)).rejects.toThrow(
      new HttpsError('not-found', 'User not found.'),
    );
  });

  it('should report partial failure if Auth deletion fails', async () => {
    mockServices.readUser.calledWith(targetUid).mockResolvedValue({ role: 'student' });
    mockServices.deleteUserProfile.mockResolvedValue(undefined);
    // Mock transaction to do nothing
    mockServices.runTransaction.mockImplementation(async (callback) => {
      const tx = mock<any>();
      tx.getUserMemberships.mockResolvedValue([]);
      await callback(tx);
    });
    mockServices.deleteAuthUser.mockRejectedValue(new Error('Auth service unavailable'));

    await expect(deleteUserHandler(deleteData, adminCtx, mockServices)).rejects.toThrow(
      new HttpsError(
        'internal',
        'User data was removed, but the authentication account could not be deleted. Please contact support.',
      ),
    );

    expect(mockServices.deleteUserProfile).toHaveBeenCalledWith(targetUid);
  });

  it('should successfully delete a user as an admin', async () => {
    mockServices.readUser.calledWith(targetUid).mockResolvedValue({ role: 'student' });
    mockServices.deleteUserProfile.mockResolvedValue(undefined);
    mockServices.deleteAuthUser.mockResolvedValue(undefined);
    // Mock transaction
    const txMock = mock<any>();
    txMock.getUserMemberships.mockResolvedValue([
      { membershipId: 'class1_user1', classId: 'class1' },
      { membershipId: 'class2_user1', classId: 'class2' },
    ]);
    txMock.getClass.mockResolvedValue({ studentCount: 10 });
    mockServices.runTransaction.mockImplementation(async (callback) => await callback(txMock));

    const result = await deleteUserHandler(deleteData, adminCtx, mockServices);

    expect(result.success).toBe(true);
    expect(result.uid).toBe(targetUid);

    // Verify transaction logic
    expect(txMock.deleteMembership).toHaveBeenCalledWith('class1_user1');
    expect(txMock.deleteMembership).toHaveBeenCalledWith('class2_user1');
    expect(txMock.updateClassStudentCount).toHaveBeenCalledWith('class1', 9);
    expect(txMock.updateClassStudentCount).toHaveBeenCalledWith('class2', 9);

    // Verify top-level calls
    expect(mockServices.deleteUserProfile).toHaveBeenCalledWith(targetUid);
    expect(mockServices.deleteAuthUser).toHaveBeenCalledWith(targetUid);
  });
});