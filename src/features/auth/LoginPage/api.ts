import { apiClient } from '@/lib/api/client';
import { encryptPassword } from '@/lib/crypto';
import type { ApiResponse, LoginRequest, LoginResponse, RefreshResponse } from '@/lib/api/types';

// GET /api/auth/public-key — 로그인 비밀번호 RSA-OAEP 암호화용 공개키.
// 매 로그인마다 새로 받는다 (서버 재기동 시 키 교체 대비 — 캐싱 금지)
async function fetchLoginPublicKey(): Promise<string | null> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ publicKey: string }>>(
      '/api/auth/public-key',
      { skipErrorToast: true },
    );
    return data.data?.publicKey ?? null;
  } catch {
    return null; // 이행기: 공개키 조회 실패 시 평문 폴백 (서버 auth.rsa.required=false)
  }
}

// POST /api/auth/login — RSA-OAEP(SHA-256) 암호화 비밀번호 전송
// vamc-npl-backend returns raw LoginResponse (no ApiResponse wrapper)
export async function login(req: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  let password = req.password;
  // SubtleCrypto는 secure context(HTTPS/localhost)에서만 동작 — 아니면 평문 폴백
  if (window.isSecureContext && window.crypto?.subtle) {
    const publicKey = await fetchLoginPublicKey();
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

// POST /api/auth/logout
export async function logout(): Promise<ApiResponse<null>> {
  await apiClient.post('/api/auth/logout');
  return { success: true, message: 'success', data: null };
}

// POST /api/auth/refresh — httpOnly cookie is sent automatically (withCredentials: true)
export async function refreshToken(): Promise<ApiResponse<RefreshResponse>> {
  const { data } = await apiClient.post<RefreshResponse>('/api/auth/refresh', {});
  return { success: true, message: 'success', data };
}
