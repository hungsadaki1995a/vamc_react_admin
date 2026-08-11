import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import { encryptPassword } from '@/lib/crypto';
import type { SearchSelectValue } from '@/components/inputs/SearchSelectField';

export interface User {
  usrId: string;
  usrNm: string;
  cpNm: string;
  email: string;
  dpCd: string;
  dpNm: string;
  jbtCd: string;
  jbcCd: string;
  gdCd: string;
  stdCost: string;
  phnNo: string;
  usrIp: string;
  mrCont: string;
  grpNm: string;
}

/** Form-layer type: dpNm holds a SearchSelectValue for DeptSelectField binding */
export interface UserFormValues extends Omit<User, 'dpNm' | 'dpCd'> {
  dpNm: SearchSelectValue | null;
}

// 서버 응답은 { status, message, data } — success 로 판정하는 ApiResponse 로 변환한다
interface RawResp<T> { status: number; message: string; data: T | null }

function toApiResp<T>(r: RawResp<T>): ApiResponse<T> {
  // Only check status — void endpoints return data:null (omitted by @JsonInclude(NON_NULL))
  return r.status === 200
    ? { success: true,  message: r.message, data: r.data as T }
    : { success: false, message: r.message, data: null };
}

export async function getUsrList(
  params: { usrId?: string; usrNm?: string; dpCd?: string },
): Promise<ApiResponse<User[]>> {
  const { data } = await apiClient.get<RawResp<User[]>>('/api/usr', { params });
  return toApiResp(data);
}

export async function saveUsr(req: User): Promise<ApiResponse<void>> {
  // map frontend 'email' field to backend 'emailAddr', exclude output-only fields
  const { email, dpNm: _dpNm, grpNm: _grpNm, ...rest } = req;
  const { data } = await apiClient.post<RawResp<void>>('/api/usr', { ...rest, emailAddr: email });
  return toApiResp(data);
}

export async function deleteUsr(usrId: string): Promise<ApiResponse<void>> {
  const { data } = await apiClient.delete<RawResp<void>>(`/api/usr/${usrId}`);
  return toApiResp(data);
}

export async function resetPwdErrCnt(usrId: string): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<RawResp<void>>(`/api/usr/${usrId}/reset-error-count`);
  return toApiResp(data);
}

export async function resetPwd(usrId: string): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<RawResp<void>>(`/api/usr/${usrId}/reset-password`);
  return toApiResp(data);
}

export async function unlockUsr(usrId: string): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<RawResp<void>>(`/api/usr/${usrId}/unlock`);
  return toApiResp(data);
}

export async function changePwd(usrId: string, newPswd: string): Promise<ApiResponse<void>> {
  const { data: keyData } = await apiClient.get<{ data: { publicKey: string } }>('/api/auth/public-key');
  const publicKey = keyData.data?.publicKey ?? (keyData as Record<string, unknown>).publicKey as string;
  const [encUsrId, encChgPasswd] = await Promise.all([
    encryptPassword(publicKey, usrId),
    encryptPassword(publicKey, newPswd),
  ]);
  const { data } = await apiClient.post<RawResp<void>>('/api/usr/change-password', { usrId: encUsrId, encChgPasswd });
  return toApiResp(data);
}
