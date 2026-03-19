import { apiClient } from '@/lib/api/client';
import { encryptPassword } from '@/lib/crypto';
import type { ApiResponse, LoginRequest, LoginResponse, RefreshResponse } from '@/lib/api/types';
import { IS_MOCK_MODE, mockLogin } from '@/mocks';

// GET /api/auth/public-key
async function fetchPublicKey(): Promise<string> {
  const { data } = await apiClient.get<{ publicKey: string }>('/api/auth/public-key');
  const d = data as Record<string, unknown>;
  return (d.data as Record<string, unknown> | undefined)?.publicKey as string ?? d.publicKey as string;
}

// POST /api/auth/login — username and password are RSA-OAEP encrypted before transmission
// ds_pms_server returns raw LoginResponse (no ApiResponse wrapper)
export async function login(req: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  if (IS_MOCK_MODE) return mockLogin(req.username);

  const publicKey = await fetchPublicKey();
  const [encryptedUsername, encryptedPassword] = await Promise.all([
    encryptPassword(publicKey, req.username),
    encryptPassword(publicKey, req.password),
  ]);

  const { data } = await apiClient.post<LoginResponse>('/api/auth/login', {
    username: encryptedUsername,
    password: encryptedPassword,
  });
  return {
    success: true,
    message: 'success',
    data,
  };
}

// POST /api/auth/logout — refresh_token cookie is cleared by server
export async function logout(): Promise<ApiResponse<null>> {
  await apiClient.post('/api/auth/logout', {}, { withCredentials: true });
  return { success: true, message: 'success', data: null };
}

// POST /api/auth/refresh — refresh_token is sent automatically via httpOnly cookie
export async function refreshToken(): Promise<ApiResponse<RefreshResponse>> {
  if (IS_MOCK_MODE) {
    return { success: true, message: 'success', data: { accessToken: 'mock-access-token' } };
  }

  const { data } = await apiClient.post<LoginResponse>(
    '/api/auth/refresh',
    {},
    { withCredentials: true },
  );
  return {
    success: true,
    message: 'success',
    data: { accessToken: data.accessToken },
  };
}

