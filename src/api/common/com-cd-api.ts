import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// ─────────────────────────────────────────────────────────────────────────────
// Common code (COM_CD) lookup API — global domain.
//
// Loads code domains (CD_DMN) and their child code lists into the comcdStore cache.
// ComcdSelect / ComcdSelectCell read from this cache. No write API (no common code management screen).
// ─────────────────────────────────────────────────────────────────────────────

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
// TODO: /api/comcd/all not implemented — enable after backend development is complete
export const getAllCodeList = async (): Promise<CodeDetail[]> => {
  // Prevent calling unimplemented API (suppress 500 error toast)
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
