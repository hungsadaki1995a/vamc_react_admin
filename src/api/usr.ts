import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import type { User } from '@/features/cco/CCO101001SC/types';

interface VamcResp<T> { status: number; message: string; data: T | null }

function toApiResp<T>(r: VamcResp<T>): ApiResponse<T> {
  return r.status === 200 && r.data !== null
    ? { success: true,  message: r.message, data: r.data }
    : { success: false, message: r.message, data: null };
}

export async function getUsrList(
  params: { usrId?: string; usrNm?: string; dpCd?: string },
): Promise<ApiResponse<User[]>> {
  const { data } = await apiClient.get<VamcResp<User[]>>('/api/usr', { params });
  return toApiResp(data);
}

export async function saveUsr(req: User): Promise<ApiResponse<void>> {
  // map frontend 'email' field to backend 'emailAddr', exclude output-only fields
  const { email, dpNm: _dpNm, grpNm: _grpNm, ...rest } = req;
  const { data } = await apiClient.post<VamcResp<void>>('/api/usr', { ...rest, emailAddr: email });
  return toApiResp(data);
}

export async function deleteUsr(usrId: string): Promise<ApiResponse<void>> {
  const { data } = await apiClient.delete<VamcResp<void>>(`/api/usr/${usrId}`);
  return toApiResp(data);
}

export async function resetPwdErrCnt(usrId: string): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<VamcResp<void>>(`/api/usr/${usrId}/reset-error-count`);
  return toApiResp(data);
}

export async function resetPwd(usrId: string): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<VamcResp<void>>(`/api/usr/${usrId}/reset-password`);
  return toApiResp(data);
}

export async function unlockUsr(usrId: string): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<VamcResp<void>>(`/api/usr/${usrId}/unlock`);
  return toApiResp(data);
}
