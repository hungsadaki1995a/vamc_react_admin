import { apiClient } from '@/lib/api/client';
import type { ApiResponse, MeResponse } from '@/lib/api/types';

interface UsrResponse {
  usrId: string;
  usrNm: string;
  email: string;
  dpCd: string;
  dpNm: string;
  phnNo: string;
  usrCCd: string;
  useYn: string;
  pswdErrCnt: number;
  lgnLockYn: string;
}

// GET /api/usr/{usrId} — vamc-npl-backend (replaces legacy /users/me)
export async function getMe(usrId: string): Promise<ApiResponse<MeResponse>> {
  const { data } = await apiClient.get<ApiResponse<UsrResponse>>(`/api/usr/${usrId}`);
  if (data.status !== 200 || !data.data) {
    return { success: false, message: data.message, data: null };
  }
  const usr = data.data;
  return {
    success: true,
    message: data.message,
    data: {
      usrId: usr.usrId,
      usrNm: usr.usrNm,
      email: usr.email,
      dpCd: usr.dpCd,
      usrCCd: usr.usrCCd,
      phnNo: usr.phnNo,
      roles: [],
    },
  };
}
