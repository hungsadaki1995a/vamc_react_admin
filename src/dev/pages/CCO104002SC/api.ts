import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProjItem {
  projId: string;
  projNm: string;
  clnNm: string;
  bzDpNm: string;
  pmId: string;
  pmNm: string;
  adminId: string;
  adminNm: string;
  pnSrDt: string;
  pnEdDt: string;
  rltSrDt: string;
  rltEdDt: string;
  rgNm: string;
  rgDttm: string;
  mfNm: string;
  mfDttm: string;
  mainSceId: string;
  sceNm: string;
  showYn: string;
  projType: string;
  childProjId: string;   // comma-separated
  childProjNm: string;   // comma-separated
}

export interface ChildProjItem {
  projId?: string;
  projNm?: string;
  childProjId?: string;
  childProjNm?: string;
}

export interface ProjSaveReq {
  projId: string;
  projNm: string;
  clnNm: string;
  bzDpNm: string;
  pmId: string;
  adminId: string;
  projType: string;
  pnSrDt: string;
  pnEdDt: string;
  mainSceId: string;
  showYn: string;
  childProjList: { childProjId: string }[];
}

export interface ProjListFilter {
  projNm?: string;
  clnNm?: string;
  bzDpNm?: string;
  pmId?: string;
  adminId?: string;
  pnSrDt1?: string;
  pnSrDt2?: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function getProjList(params: ProjListFilter): Promise<ApiResponse<ProjItem[]>> {
  const { data } = await apiClient.get<ApiResponse<ProjItem[]>>('/api/proj/mgmt', { params });
  return data;
}

export async function saveProj(req: ProjSaveReq): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<ApiResponse<void>>('/api/proj/mgmt', req);
  return data;
}

export async function deleteProj(projId: string): Promise<ApiResponse<void>> {
  const { data } = await apiClient.delete<ApiResponse<void>>(`/api/proj/mgmt/${projId}`);
  return data;
}

export async function getAddChildProjList(params: {
  parentsProjId: string;
  projNm?: string;
  clnNm?: string;
}): Promise<ApiResponse<ChildProjItem[]>> {
  const { data } = await apiClient.get<ApiResponse<ChildProjItem[]>>('/api/proj/mgmt/child/available', { params });
  return data;
}

export async function getChildProjList(params: {
  parentsProjId: string;
  projNm?: string;
}): Promise<ApiResponse<ChildProjItem[]>> {
  const { data } = await apiClient.get<ApiResponse<ChildProjItem[]>>('/api/proj/mgmt/child', { params });
  return data;
}
