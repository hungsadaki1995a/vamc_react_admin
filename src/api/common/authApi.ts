import { apiClient } from '@/lib/api/client';
import { encryptPassword } from '@/lib/crypto';
import type { ApiResponse, LoginRequest, LoginResponse, RefreshResponse } from '@/lib/api/types';

// ─────────────────────────────────────────────────────────────────────────────
// 인증(AUTH) API — 전역 도메인.
//
// 로그인 화면 하나가 아니라 앱 전체가 쓴다:
//   · login          → src/features/auth/LoginPage
//   · logout         → src/hooks/useLogout
//   · refreshToken   → src/app/App.tsx (앱 로드 시 세션 복원)
//   · fetchPublicKey → 로그인 + 비밀번호 변경(src/api/sys/usrPwdApi.ts)
//
// ⚠️ 401 발생 시의 silent refresh 는 이 파일이 아니라 `src/lib/api/client.ts` 인터셉터가
//    axios 로 직접 호출한다(순환 import 회피). 여기 refreshToken 은 앱 로드 시 1회용이다.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/auth/public-key — 비밀번호 RSA-OAEP 암호화용 공개키.
 *
 * **매번 새로 받는다 (캐싱 금지)** — 서버가 재기동/회전 시 키를 바꾼다.
 * 조회 실패 시 `null` — 호출부가 평문 폴백 여부를 정한다
 * (서버 `auth.rsa.required=false` 이행기 대응).
 */
export async function fetchPublicKey(): Promise<string | null> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ publicKey: string }>>(
      '/api/auth/public-key',
      { skipErrorToast: true },
    );
    return data.data?.publicKey ?? null;
  } catch {
    return null;
  }
}

/**
 * POST /api/auth/login — RSA-OAEP(SHA-256) 암호화 비밀번호 전송.
 *
 * SubtleCrypto 는 secure context(HTTPS/localhost)에서만 동작하므로,
 * 그 밖에서는 평문으로 폴백한다.
 * 서버는 이 엔드포인트만 ApiResponse 래퍼 없이 raw LoginResponse 를 내려준다.
 */
export async function login(req: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  let password = req.password;
  if (window.isSecureContext && window.crypto?.subtle) {
    const publicKey = await fetchPublicKey();
    if (publicKey) {
      password = await encryptPassword(publicKey, req.password);
    }
  }
  const { data } = await apiClient.post<LoginResponse>('/api/auth/login', {
    username: req.username,
    password,
  });
  return { success: true, message: 'success', data };
}

/** POST /api/auth/logout — 서버측 refresh 토큰 폐기 */
export async function logout(): Promise<ApiResponse<null>> {
  await apiClient.post('/api/auth/logout');
  return { success: true, message: 'success', data: null };
}

/** POST /api/auth/refresh — refresh_token 은 httpOnly 쿠키라 자동 전송된다 (withCredentials: true) */
export async function refreshToken(): Promise<ApiResponse<RefreshResponse>> {
  const { data } = await apiClient.post<RefreshResponse>('/api/auth/refresh', {});
  return { success: true, message: 'success', data };
}
