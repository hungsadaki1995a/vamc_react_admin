import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

/**
 * 화면(SCE) API — 시스템 운영 관리 도메인.
 * ⚠️ 서버 미구현: `/api/sce/**` 컨트롤러가 양 백엔드에 없다(2026-08-27 실측). 호출하면 404 다.
 */
export interface SceItem {
  bzLrgCzCd: string;
  sceId: string;
  sceNm: string;
  popupYn: string;
  labelKey?: string;
  labelNm?: string;
}

export interface SceQueryParams {
  bzLrgCzCd?: string;
  sceId?: string;
  sceNm?: string;
  popupYn?: string;
}

export async function getSceList(params: SceQueryParams): Promise<ApiResponse<SceItem[]>> {
  const { data } = await apiClient.get<ApiResponse<SceItem[]>>('/api/sce', { params });
  return data;
}
