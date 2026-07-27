import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// Matches com.vamc.vamcnplbackend.common.code.dto.CodeDomainResponse
export interface CodeDomain {
  projId: string;
  bzLrgCzCd: string;
  cdDmnId: string;
  cdDmnNm: string;
}

// Matches com.vamc.vamcnplbackend.common.code.dto.CodeDetailResponse
export interface CodeDetail {
  projId: string;
  bzLrgCzCd: string;
  cdDmnId: string;
  cd: string;
  cdNm: string;
  sortRank: number;
}

// GET /api/comcd/codes — dropdown use, cached
export const getCodeList = async (projId: string, cdDmnId: string): Promise<CodeDetail[]> => {
  const { data } = await apiClient.get<ApiResponse<CodeDetail[]>>('/api/comcd/codes', {
    params: { projId, cdDmnId }
  });
  if (!data.data) throw new Error(data.message || 'Failed to load codes');
  return data.data;
};

// GET /api/comcd/all — all code details for frontend bulk-cache (no auth required)
// X-Project-Id and X-Lang headers are injected automatically by the axios interceptor
// TODO: /api/comcd/all 미구현 — 백엔드 개발 완료 후 활성화
export const getAllCodeList = async (): Promise<CodeDetail[]> => {
  // 미구현 API 호출 방지 (500 에러 토스트 차단)
  // const { data } = await apiClient.get<ApiResponse<CodeDetail[]>>('/api/comcd/all');
  // return data.data ?? [];
  return [];
};

// GET /api/comcd/domains — domain list
export const getCodeDomains = async (projId: string): Promise<CodeDomain[]> => {
  const { data } = await apiClient.get<ApiResponse<CodeDomain[]>>('/api/comcd/domains', {
    params: { projId }
  });
  if (!data.data) throw new Error(data.message || 'Failed to load codes');
  return data.data;
};
