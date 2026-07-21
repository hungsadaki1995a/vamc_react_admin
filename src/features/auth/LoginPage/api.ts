import { apiClient } from '@/lib/api/client';
import type { ApiResponse, LoginRequest, LoginResponse, RefreshResponse } from '@/lib/api/types';

// POST /api/auth/login — plain credentials (no RSA encryption)
// vamc-npl-backend returns raw LoginResponse (no ApiResponse wrapper)
export async function login(req: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  const { data } = await apiClient.post<LoginResponse>('/api/auth/login', {
    username: req.username,
    password: req.password,
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
