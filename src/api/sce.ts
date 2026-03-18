import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

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
