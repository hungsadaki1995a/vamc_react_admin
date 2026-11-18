import { apiClient } from '@/lib/api/client';
import { encryptPassword } from '@/lib/crypto';
import type { ApiResponse, LoginRequest, LoginResponse, RefreshResponse } from '@/lib/api/types';

// ─────────────────────────────────────────────────────────────────────────────
// Auth (AUTH) API — global domain.
//
// Used across the entire app, not just the login screen:
//   · login          → src/features/auth/LoginPage
//   · logout         → src/hooks/useLogout
//   · refreshToken   → src/app/App.tsx (session restore on app load)
//   · fetchPublicKey → login + password change (src/api/sys/usrPwdApi.ts)
//
// ⚠️ On 401, silent refresh is called directly via axios in `src/lib/api/client.ts` interceptor
//    (to avoid circular imports). refreshToken here is one-time use on app load.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/auth/public-key — public key for RSA-OAEP password encryption.
 *
 * **Fetch fresh every time (no caching)** — server rotates keys on restart/rotation.
 * Returns `null` on failure — caller decides whether to fall back to plaintext
 * (supports server `auth.rsa.required=false` transition period).
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
 * POST /api/auth/login — sends RSA-OAEP (SHA-256) encrypted password.
 *
 * SubtleCrypto only works in secure contexts (HTTPS/localhost), so
 * falls back to plaintext otherwise.
 * Only this endpoint returns raw LoginResponse without an ApiResponse wrapper.
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
    loginId: req.loginId,
    password,
  });
  return { success: true, message: 'success', data };
}

/** POST /api/auth/logout — revokes server-side refresh token */
export async function logout(): Promise<ApiResponse<null>> {
  await apiClient.post('/api/auth/logout');
  return { success: true, message: 'success', data: null };
}

/** POST /api/auth/refresh — refresh_token is an httpOnly cookie sent automatically (withCredentials: true) */
export async function refreshToken(): Promise<ApiResponse<RefreshResponse>> {
  const { data } = await apiClient.post<RefreshResponse>('/api/auth/refresh', {});
  return { success: true, message: 'success', data };
}
