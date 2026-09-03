import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import { encryptPassword } from '@/lib/crypto';
import { fetchPublicKey } from '@/api/common/authApi';

/**
 * 사용자 비밀번호 변경 API — 시스템 운영 관리 도메인.
 *
 * 로그인 직후 초기 비밀번호 변경 모달(`features/auth/InitChangePwModal`)이 쓴다.
 *
 * ⚠️ 이 파일에는 **서버에 실제로 구현된 호출만** 둔다. 사용자 조회·등록·수정 API 는
 *    양 백엔드에 컨트롤러가 없으므로, 사용자 관리 화면을 만들 때 서버부터 구현하고
 *    `usrMngApi.ts` 를 새로 만든다.
 */

// 서버 응답은 { status, message, data } — success 로 판정하는 ApiResponse 로 변환한다
interface RawResp<T> { status: number; message: string; data: T | null }

/**
 * POST /api/usr/change-password — 비밀번호 변경 (RSA-OAEP 암호화 전송).
 * 공개키는 매번 새로 조회한다(캐싱 금지 — 서버가 키를 회전시킨다).
 */
export async function changePwd(usrId: string, newPswd: string): Promise<ApiResponse<void>> {
  // 공개키 조회는 로그인과 같은 엔드포인트다 — `@/api/common/authApi` 하나만 쓴다.
  // 비밀번호 변경은 로그인과 달리 평문 폴백이 없다(항상 암호화 전송).
  const publicKey = await fetchPublicKey();
  if (!publicKey) {
    return { success: false, message: '공개키를 가져오지 못해 비밀번호를 변경할 수 없습니다.', data: null };
  }
  const [encUsrId, encChgPasswd] = await Promise.all([
    encryptPassword(publicKey, usrId),
    encryptPassword(publicKey, newPswd),
  ]);
  const { data } = await apiClient.post<RawResp<void>>('/api/usr/change-password', { usrId: encUsrId, encChgPasswd });
  return data.status === 200
    ? { success: true,  message: data.message, data: null }
    : { success: false, message: data.message, data: null };
}
