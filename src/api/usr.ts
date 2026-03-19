import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

export interface UsrSimple {
  usrId: string;
  usrNm: string;
  dpNm?: string;
  jbtCd?: string;
}

export interface UsrQueryParams {
  usrId?: string;
  usrNm?: string;
  dpCd?: string;
}

// Wrapper because UsrController returns VamcApiResponse
interface VamcResp<T> { status: number; message: string; data: T | null }

function toApiResp<T>(r: VamcResp<T>): ApiResponse<T> {
  return r.status === 200
    ? { success: true,  message: r.message, data: r.data as T }
    : { success: false, message: r.message, data: null };
}

export async function getUsrSimpleList(params: UsrQueryParams): Promise<ApiResponse<UsrSimple[]>> {
  const { data } = await apiClient.get<VamcResp<UsrSimple[]>>('/api/usr', { params });
  return toApiResp(data);
}
