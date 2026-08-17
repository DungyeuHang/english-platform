import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpsError } from 'firebase-functions/v2/https';
import { mock, mockDeep } from 'vitest-mock-extended';
import type { AdminServices, AuthContext } from './services';
import { addStudentToClassHandler, removeStudentFromClassHandler } from './membershipHandlers';

const mockServices = mockDeep<AdminServices>();

describe('addStudentToClassHandler', () => {
  const classId = 'class1';
  const studentId = 'student1';
  const addData = { classId, studentId };

  beforeEach(() => {
    vi.resetAllMocks();
    // Default transaction mock
    mockServices.runTransaction.mockImplementation(async (callback) => {
      const tx = mock<any>();
      tx.getClass.mockResolvedValue({ id: classId, teacherId: 'teacher1', studentCount: 5 });
      tx.getUser.mockResolvedValue({ uid: studentId, role: 'student', classIds: [] });
      tx.getMemberships.mockResolvedValue([]);
      await callback(tx);
    });
  });

  const testPermissionDenied = async (ctx: AuthContext, userProfile: any) => {
    if (ctx.uid) {
      mockServices.readUser.calledWith(ctx.uid).mockResolvedValue(userProfile);
    }
    await expect(addStudentToClassHandler(addData, ctx, mockServices)).rejects.toThrow(
      new HttpsError('permission-denied', 'You do not have permission to manage class members.'),
    );
  };

  it('should deny unauthenticated users', async () => {
    await testPermissionDenied({ uid: null }, null);
  });

  it('should deny students', async () => {
    await testPermissionDenied({ uid: 'student1' }, { role: 'student', status: 'active' });
  });

  it('should deny disabled teachers', async () => {
    await testPermissionDenied({ uid: 'teacher1' }, { role: 'teacher', status: 'disabled' });
  });

  it('should deny a teacher not assigned to the class', async () => {
    const ctx = { uid: 'wrongTeacher' };
    mockServices.readUser.calledWith(ctx.uid).mockResolvedValue({ role: 'teacher', status: 'active' });
    // The mock transaction returns a class taught by 'teacher1'
    await expect(addStudentToClassHandler(addData, ctx, mockServices)).rejects.toThrow(
      new HttpsError('permission-denied', 'You are not assigned to this class.'),
    );
  });

  it('should allow the assigned teacher', async () => {
    const ctx = { uid: 'teacher1' };
    mockServices.readUser.calledWith(ctx.uid).mockResolvedValue({ role: 'teacher', status: 'active' });
    await expect(addStudentToClassHandler(addData, ctx, mockServices)).resolves.not.toThrow();
  });

  it('should allow an admin', async () => {
    const ctx = { uid: 'admin1' };
    mockServices.readUser.calledWith(ctx.uid).mockResolvedValue({ role: 'admin', status: 'active' });
    await expect(addStudentToClassHandler(addData, ctx, mockServices)).resolves.not.toThrow();
  });

  it('should be idempotent and not add a student twice', async () => {
    const ctx = { uid: 'admin1' };
    mockServices.readUser.calledWith(ctx.uid).mockResolvedValue({ role: 'admin', status: 'active' });

    const txMock = mock<any>();
    txMock.getClass.mockResolvedValue({ id: classId, teacherId: 'teacher1', studentCount: 5 });
    txMock.getUser.mockResolvedValue({ uid: studentId, role: 'student', classIds: [classId] });
    // Simulate that a membership already exists
    txMock.getMemberships.mockResolvedValue(['some_id']);
    mockServices.runTransaction.mockImplementation(async (callback) => await callback(txMock));

    await addStudentToClassHandler(addData, ctx, mockServices);

    // Expect no write operations to have been called
    expect(txMock.setMembership).not.toHaveBeenCalled();
    expect(txMock.updateUserClassIds).not.toHaveBeenCalled();
    expect(txMock.updateClassStudentCount).not.toHaveBeenCalled();
  });

  it('should correctly add a student and update counts', async () => {
    const ctx = { uid: 'admin1' };
    mockServices.readUser.calledWith(ctx.uid).mockResolvedValue({ role: 'admin', status: 'active' });

    const txMock = mock<any>();
    txMock.getClass.mockResolvedValue({ id: classId, teacherId: 'teacher1', studentCount: 5 });
    txMock.getUser.mockResolvedValue({ uid: studentId, role: 'student', classIds: [] });
    txMock.getMemberships.mockResolvedValue([]); // No existing membership
    mockServices.runTransaction.mockImplementation(async (callback) => await callback(txMock));

    const result = await addStudentToClassHandler(addData, ctx, mockServices);

    expect(result.success).toBe(true);
    expect(txMock.setMembership).toHaveBeenCalledWith(`${classId}_${studentId}`, classId, studentId);
    expect(txMock.updateUserClassIds).toHaveBeenCalledWith(studentId, [classId]);
    expect(txMock.updateClassStudentCount).toHaveBeenCalledWith(classId, 6);
  });
});

describe('removeStudentFromClassHandler', () => {
  const classId = 'class1';
  const studentId = 'student1';
  const removeData = { classId, studentId };

  beforeEach(() => {
    vi.resetAllMocks();
    // Default transaction mock
    mockServices.runTransaction.mockImplementation(async (callback) => {
      const tx = mock<any>();
      tx.getClass.mockResolvedValue({ id: classId, teacherId: 'teacher1', studentCount: 5 });
      tx.getUser.mockResolvedValue({ uid: studentId, role: 'student', classIds: [classId] });
      tx.getMemberships.mockResolvedValue([`${classId}_${studentId}`]);
      await callback(tx);
    });
  });

  it('should be idempotent if student is not a member', async () => {
    const ctx = { uid: 'admin1' };
    mockServices.readUser.calledWith(ctx.uid).mockResolvedValue({ role: 'admin', status: 'active' });

    const txMock = mock<any>();
    txMock.getClass.mockResolvedValue({ id: classId, teacherId: 'teacher1', studentCount: 5 });
    txMock.getMemberships.mockResolvedValue([]); // Student not a member
    mockServices.runTransaction.mockImplementation(async (callback) => await callback(txMock));

    await removeStudentFromClassHandler(removeData, ctx, mockServices);

    expect(txMock.deleteMembership).not.toHaveBeenCalled();
    expect(txMock.updateUserClassIds).not.toHaveBeenCalled();
    expect(txMock.updateClassStudentCount).not.toHaveBeenCalled();
  });

  it('should remove all legacy duplicate memberships and compensate count', async () => {
    const ctx = { uid: 'admin1' };
    mockServices.readUser.calledWith(ctx.uid).mockResolvedValue({ role: 'admin', status: 'active' });

    const txMock = mock<any>();
    txMock.getClass.mockResolvedValue({ id: classId, teacherId: 'teacher1', studentCount: 5 });
    txMock.getUser.mockResolvedValue({ uid: studentId, role: 'student', classIds: [classId] });
    // Simulate 3 legacy duplicate memberships
    txMock.getMemberships.mockResolvedValue(['dup1', 'dup2', 'dup3']);
    mockServices.runTransaction.mockImplementation(async (callback) => await callback(txMock));

    await removeStudentFromClassHandler(removeData, ctx, mockServices);

    expect(txMock.deleteMembership).toHaveBeenCalledTimes(3);
    expect(txMock.deleteMembership).toHaveBeenCalledWith('dup1');
    expect(txMock.deleteMembership).toHaveBeenCalledWith('dup2');
    expect(txMock.deleteMembership).toHaveBeenCalledWith('dup3');

    expect(txMock.updateUserClassIds).toHaveBeenCalledWith(studentId, []);
    // studentCount (5) - memberships.length (3) = 2
    expect(txMock.updateClassStudentCount).toHaveBeenCalledWith(classId, 2);
  });

  it('should correctly remove a student and update counts', async () => {
    const ctx = { uid: 'admin1' };
    mockServices.readUser.calledWith(ctx.uid).mockResolvedValue({ role: 'admin', status: 'active' });

    const result = await removeStudentFromClassHandler(removeData, mockServices.runTransaction.getMockImplementation());

    expect(result.success).toBe(true);
  });
});