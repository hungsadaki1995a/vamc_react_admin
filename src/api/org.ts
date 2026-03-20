import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// Matches OrgMapper.xml / OrgResponse.java (ds_pms_server)
// DB: T_CCO_ORG_M (ORG_ID, ORG_NM, UP_ORG_ID, ORG_LEV_NO, DEPT_SEQ)
export interface OrgItem {
  orgId: string;      // ORG_ID (PK, dept code)
  orgNm: string;      // ORG_NM (plain name)
  displayNm: string;  // indented name for tree display (computed in SQL)
  upOrgId: string;    // UP_ORG_ID (parent org)
  orgLevNo: number;   // ORG_LEV_NO (hierarchy level, 1=root)
  deptSeq: number;    // DEPT_SEQ (sort order)
}

// GET /api/org/tree — full tree with displayNm indented by level
export async function getOrgTree(): Promise<OrgItem[]> {
  const { data } = await apiClient.get<ApiResponse<OrgItem[]>>('/api/org/tree');
  return data.data ?? [];
}

// GET /api/org?orgNm= — flat list filtered by name
export async function getOrgList(params?: { orgNm?: string }): Promise<OrgItem[]> {
  const { data } = await apiClient.get<ApiResponse<OrgItem[]>>('/api/org', { params });
  return data.data ?? [];
}
