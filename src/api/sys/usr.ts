import { apiClient } from '@/lib/api/client';
import type { ApiResponse, MeResponse } from '@/lib/api/types';
import { encryptPassword } from '@/lib/crypto';

/**
 * 사용자(USR) API — 시스템 운영 관리 도메인.
 *
 * ⚠️ 서버 미구현: `/api/usr/**` 는 vamc-npl-backend / vamc-npl-admin-backend 어디에도
 *    컨트롤러가 없다(2026-08-27 실측). 호출하면 404 다.
 *    사용자 관리 화면을 실제로 살릴 때 서버부터 구현해야 한다.
 *    샘플 화면: `src/dev/pages/CCO101001SC/`
 */

export interface UsrSimple {
  usrId: string;
  usrNm: string;
  dpNm?: string;
  jbtCd?: string;
}

export interface UsrQueryParams {
  usrId?: string;
  usrNm?: string;
  dpCd?: string;
}

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

// 서버 응답은 { status, message, data } — success 로 판정하는 ApiResponse 로 변환한다
interface RawResp<T> { status: number; message: string; data: T | null }

function toApiResp<T>(r: RawResp<T>): ApiResponse<T> {
  return r.status === 200
    ? { success: true,  message: r.message, data: r.data as T }
    : { success: false, message: r.message, data: null };
}

/** GET /api/usr — 선택 컴포넌트용 간이 목록 */
export async function getUsrSimpleList(params: UsrQueryParams): Promise<ApiResponse<UsrSimple[]>> {
  const { data } = await apiClient.get<RawResp<UsrSimple[]>>('/api/usr', { params });
  return toApiResp(data);
}

/** GET /api/usr/{usrId} — 로그인 사용자 상세 */
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

/**
 * POST /api/usr/change-password — 비밀번호 변경 (RSA-OAEP 암호화 전송).
 * 공개키는 매번 새로 조회한다(캐싱 금지 — 서버가 키를 회전시킨다).
 */
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
