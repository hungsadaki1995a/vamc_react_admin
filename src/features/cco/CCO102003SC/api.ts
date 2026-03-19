import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface LblItem {
  lblId: string;
  lblTpCd: string;  // L=Label, M=Message, T=Title
  mrCont: string;
  rgDttm?: string;  // ISO 8601 string
  mfDttm?: string;
}

export interface LblTrnItem {
  lblId: string;
  lclCd: string;
  lblTxt: string;
  projTxt?: string;       // client-only: project-level override text
  _isNew?: boolean;       // client-only: new row not yet saved
  _isDirty?: boolean;     // client-only: common lblTxt modified
  _isProjDirty?: boolean; // client-only: projTxt modified
  _rowId?: string;        // client-only: unique row ID for AG Grid (new rows share empty lclCd)
}

export interface LblSaveReq {
  lblId: string;
  mrCont?: string;
}

export interface LblTrnSaveReq {
  lblId: string;
  lclCd: string;
  lblTxt: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

/** 라벨 목록 조회 — useApiQuery에 직접 전달 */
export async function getLblList(lblTpCd?: string): Promise<ApiResponse<LblItem[]>> {
  const params = lblTpCd ? { lblTpCd } : {};
  const { data } = await apiClient.get<ApiResponse<LblItem[]>>('/api/lbl', { params });
  return data;
}

/** 번역 목록 조회 — 내부에서 success 체크 */
export async function getLblTrnList(lblId: string): Promise<LblTrnItem[]> {
  const { data } = await apiClient.get<ApiResponse<LblTrnItem[]>>(
    `/api/lbl/${lblId}/translations`,
  );
  if (!data.success) throw new Error(data.message ?? '번역 조회 실패');
  return data.data ?? [];
}

/** 라벨 저장 (upsert) */
export async function saveLbl(req: LblSaveReq): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<ApiResponse<void>>('/api/lbl', req);
  return data;
}

/** 번역 단건 저장 (upsert) */
export async function saveLblTrn(req: LblTrnSaveReq): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<ApiResponse<void>>('/api/lbl/translations', req);
  return data;
}

export interface LblTrnBatchItem {
  lblId: string;
  lclCd: string;
  lblTxt: string;
  saveCommon: boolean;  // true → save common lblTxt
  projId?: string;      // present → save project override
  projTxt?: string;     // project-level translated text
}

/** 번역 일괄 저장 — 단일 트랜잭션 (all-or-nothing) */
export async function saveLblTrnBatch(items: LblTrnBatchItem[]): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<ApiResponse<void>>('/api/lbl/translations/batch', items);
  return data;
}

/** 프로젝트별 번역 목록 조회 */
export async function getProjLblTrnList(projId: string, lblId: string): Promise<LblTrnItem[]> {
  const { data } = await apiClient.get<ApiResponse<LblTrnItem[]>>(
    `/api/lbl/${lblId}/proj-translations`,
    { params: { projId } },
  );
  if (!data.success) throw new Error(data.message ?? '프로젝트 번역 조회 실패');
  return data.data ?? [];
}

export interface LblProjTrnSaveReq {
  projId: string;
  lblId: string;
  lclCd: string;
  lblTxt: string;
}

/** 프로젝트별 번역 단건 저장 (upsert) */
export async function saveProjLblTrn(req: LblProjTrnSaveReq): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<ApiResponse<void>>('/api/lbl/proj-translations', req);
  return data;
}

/** 번역 일괄 삭제 — 단일 트랜잭션 */
export async function deleteLblTrnBatch(
  lblId: string,
  lclCds: string[],
  projId?: string,
): Promise<ApiResponse<void>> {
  const params: Record<string, unknown> = { lblId, lclCds };
  if (projId) params.projId = projId;
  const { data } = await apiClient.delete<ApiResponse<void>>('/api/lbl/translations/batch', { params });
  return data;
}

/** 라벨 삭제 (cascade) */
export async function deleteLbl(lblId: string): Promise<ApiResponse<void>> {
  const { data } = await apiClient.delete<ApiResponse<void>>(`/api/lbl/${lblId}`);
  return data;
}
