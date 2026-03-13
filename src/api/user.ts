import { mockGetMe } from '@/mock/services/authService';
import type { ApiResponse, MeResponse } from '@/lib/api/types';

export async function getMe(_usrId: string): Promise<ApiResponse<MeResponse>> {
  return { success: true, message: 'success', data: mockGetMe() };
}
