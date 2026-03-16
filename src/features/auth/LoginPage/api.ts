import { apiClient } from '@/lib/api/client';
import { encryptPassword } from '@/lib/crypto';
import type { ApiResponse, LoginRequest, LoginResponse, RefreshResponse } from '@/lib/api/types';

// GET /api/auth/public-key
async function fetchPublicKey(): Promise<string> {
  const { data } = await apiClient.get<{ publicKey: string }>('/api/auth/public-key');
  return (data as any).data?.publicKey ?? (data as any).publicKey;
}

// POST /api/auth/login — username and password are RSA-OAEP encrypted before transmission
// vamc-npl-backend returns raw LoginResponse (no ApiResponse wrapper)
export async function login(req: LoginRequest): Promise<ApiResponse<LoginResponse>> {
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

