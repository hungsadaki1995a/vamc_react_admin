import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

export interface Mnu {
  bzLrgCzCd: string;
  mnuId: string;
  mnuNm: string;
  upMnuId?: string;
  mnuRank?: number;
  mnuLevRank?: number;
  sceId?: string;
  sceNm?: string;
  sceXrsYn: string;
  mnuXrsYn: string;
  labelKey?: string;
  labelNm?: string;
  mrCont?: string;
}

export interface MnuSaveReq {
  bzLrgCzCd: string;
  mnuId: string;
  mnuNm: string;
  upMnuId?: string;
  mnuRank?: number;
  sceId?: string;
  sceXrsYn?: string;
  mnuXrsYn?: string;
  labelKey?: string;
  mrCont?: string;
}

export interface MnuQueryParams {
  bzLrgCzCd?: string;
  mnuId?: string;
  mnuNm?: string;
}

export async function getMnuList(params: MnuQueryParams): Promise<ApiResponse<Mnu[]>> {
  const { data } = await apiClient.get<ApiResponse<Mnu[]>>('/api/mnu', { params });
  return data;
}

export async function saveMnu(req: MnuSaveReq): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<ApiResponse<void>>('/api/mnu', req);
  return data;
}

export async function deleteMnu(bzLrgCzCd: string, mnuId: string): Promise<ApiResponse<void>> {
  const { data } = await apiClient.delete<ApiResponse<void>>('/api/mnu', {
    params: { bzLrgCzCd, mnuId },
  });
  return data;
}
