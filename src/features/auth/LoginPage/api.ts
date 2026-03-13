import { mockLogin } from '@/mock/services/authService';
import type { ApiResponse, LoginRequest, LoginResponse, RefreshResponse } from '@/lib/api/types';

export async function login(req: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return { success: true, message: 'success', data: mockLogin(req.username, req.password) };
}

export async function logout(): Promise<ApiResponse<null>> {
  return { success: true, message: 'success', data: null };
}

export async function refreshToken(): Promise<ApiResponse<RefreshResponse>> {
  return { success: true, message: 'success', data: { accessToken: 'mock-access-token' } };
}
