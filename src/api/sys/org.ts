import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

/**
 * 조직(ORG) API — 시스템 운영 관리 도메인.
 * ⚠️ 서버 미구현: `/api/org/**` 컨트롤러가 양 백엔드에 없다(2026-08-27 실측). 호출하면 404 다.
 */
// Matches OrgMapper.xml / OrgResponse.java
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
