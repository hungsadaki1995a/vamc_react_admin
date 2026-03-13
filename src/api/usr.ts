import { mockGetUsrList, mockSaveUsr, mockDeleteUsr, mockResetPwdErrCnt, mockResetPwd, mockUnlockUsr } from '@/mock/services/usrService';
import type { ApiResponse } from '@/lib/api/types';
import type { User } from '@/features/cco/CCO101001SC/types';

export async function getUsrList(
  params: { usrId?: string; usrNm?: string; dpCd?: string },
): Promise<ApiResponse<User[]>> {
  return mockGetUsrList(params);
}

export async function saveUsr(req: User): Promise<ApiResponse<void>> {
  return mockSaveUsr(req);
}

export async function deleteUsr(usrId: string): Promise<ApiResponse<void>> {
  return mockDeleteUsr(usrId);
}

export async function resetPwdErrCnt(usrId: string): Promise<ApiResponse<void>> {
  return mockResetPwdErrCnt(usrId);
}

export async function resetPwd(usrId: string): Promise<ApiResponse<void>> {
  return mockResetPwd(usrId);
}

export async function unlockUsr(usrId: string): Promise<ApiResponse<void>> {
  return mockUnlockUsr(usrId);
}
