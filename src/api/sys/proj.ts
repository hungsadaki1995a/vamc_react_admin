import { apiClient } from '@/lib/api/client';
import type { ApiResponse, MyProjectResponseDto } from '@/lib/api/types';

/**
 * 프로젝트(PROJ) API — 시스템 운영 관리 도메인.
 * ⚠️ 서버 미구현: `/api/proj/**` 컨트롤러가 양 백엔드에 없다(2026-08-27 실측). 호출하면 404 다.
 *    projectStore 의 프로젝트 목록이 항상 비는 원인이다.
 */
// GET /api/proj/my — 로그인 사용자가 참여 중인 프로젝트 목록
export async function getMyProjects(): Promise<ApiResponse<MyProjectResponseDto[]>> {
  const { data } = await apiClient.get<ApiResponse<MyProjectResponseDto[]>>('/api/proj/my');
  return {
    success: data.status === 200,
    message: data.message,
    data: data.data ?? [],
  };
}
