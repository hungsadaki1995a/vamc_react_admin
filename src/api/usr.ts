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

// 서버 응답은 { status, message, data } — success 로 판정하는 ApiResponse 로 변환한다
interface RawResp<T> { status: number; message: string; data: T | null }

function toApiResp<T>(r: RawResp<T>): ApiResponse<T> {
  return r.status === 200
    ? { success: true,  message: r.message, data: r.data as T }
    : { success: false, message: r.message, data: null };
}

export async function getUsrSimpleList(params: UsrQueryParams): Promise<ApiResponse<UsrSimple[]>> {
  const { data } = await apiClient.get<RawResp<UsrSimple[]>>('/api/usr', { params });
  return toApiResp(data);
}
