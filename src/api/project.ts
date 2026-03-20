import { apiClient } from '@/lib/api/client';
import type { ApiResponse, MyProjectResponseDto } from '@/lib/api/types';
import { IS_MOCK_MODE, mockGetMyProjects } from '@/mocks';

// GET /api/proj/my — 로그인 사용자가 참여 중인 프로젝트 목록
export async function getMyProjects(): Promise<ApiResponse<MyProjectResponseDto[]>> {
  if (IS_MOCK_MODE) return mockGetMyProjects();

  const { data } = await apiClient.get<ApiResponse<MyProjectResponseDto[]>>('/api/proj/my');
  return {
    success: data.status === 200,
    message: data.message,
    data: data.data ?? [],
  };
}
