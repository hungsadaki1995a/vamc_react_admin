import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// Common code lookup — CommonCodeController (`/api/common/codes`).
// Returns only codes in use, ordered by sortSeq. An unknown group answers an empty list.

export interface CommonCode {
  groupCd: string;
  cd: string;
  /** Raw DB name (not translated by this endpoint). */
  cdNm: string;
  sortSeq?: number;
  lblCd?: string;
}

export async function getCommonCodes(groupCd: string): Promise<ApiResponse<CommonCode[]>> {
  const { data } = await apiClient.get<{ status?: number; message?: string; data?: CommonCode[] }>(
    `/api/common/codes/${groupCd}`,
  );
  return {
    status: data.status,
    success: data.status === 200,
    message: data.message ?? '',
    data: data.data ?? [],
  };
}
