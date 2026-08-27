import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

export interface Sce {
  bzLrgCzCd: string;
  sceId: string;
  sceNm: string;
  sceUrl?: string;
  popupYn: string;
  labelKey?: string;
  labelNm?: string;
  mrCont?: string;
}

export interface SceSaveReq {
  bzLrgCzCd: string;
  sceId: string;
  sceNm: string;
  sceUrl?: string;
  popupYn?: string;
  labelKey?: string;
  mrCont?: string;
  newYn: boolean;
}

export interface SceQueryParams {
  bzLrgCzCd?: string;
  sceId?: string;
  sceNm?: string;
  popupYn?: string;
}

export async function getSceList(params: SceQueryParams): Promise<ApiResponse<Sce[]>> {
  const { data } = await apiClient.get<ApiResponse<Sce[]>>('/api/sce', { params });
  return data;
}

export async function saveSce(req: SceSaveReq): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<ApiResponse<void>>('/api/sce', req);
  return data;
}

export async function deleteSce(bzLrgCzCd: string, sceId: string): Promise<ApiResponse<void>> {
  const { data } = await apiClient.delete<ApiResponse<void>>('/api/sce', {
    params: { bzLrgCzCd, sceId },
  });
  return data;
}
