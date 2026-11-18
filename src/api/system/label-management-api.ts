import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// ─────────────────────────────────────────────────────────────────────────────
// Multilingual label management API — system operations domain (menu A06040300 / screen SYS050301SC)
//
// Server contract follows the LANG_LBL / LANG_LBL_TRSL schema directly.
//   · Label identifier is not a single key, but a 3-column PK (LBL_CD, SCRN_ID, LBL_SE_CD).
//   · Translation is an attribute of a label, identified by (LANG_CD + the 3 columns above).
// Legacy screen fields lblId / lclCd / lblTxt / projTxt (from PMS) were removed as no matching table exists.
//
// ⚠️ Bootstrap label lookup (`/api/lbl/bulk`) and supported language list (`/api/lbl/languages`)
//    are shared across all screens in `@/api/common/lblBulkApi`. Keep only management-screen CRUD here.
// ─────────────────────────────────────────────────────────────────────────────

/** One label-translation row — 1:1 with server LblSaveItem. Labels without translation have empty langCd/trslLtr. */
export interface LblRow {
  lblCd:     string;   // Label code (globally unique convention — screen labels are prefixed with sceId)
  scrnId:    string;   // Screen ID
  lblSeCd:   string;   // Label type code
  lblExpln?: string;   // Label description (default text)
  langCd?:   string;   // Language code KR/EN/VN
  trslLtr?:  string;   // Translated string
}

/** One row in the left grid — 1 label + per-language translation map */
export interface LblMaster {
  rowId:    string;                    // `${lblCd}|${scrnId}|${lblSeCd}` — AG Grid row key
  lblCd:    string;
  scrnId:   string;
  lblSeCd:  string;
  lblExpln: string;
  trsl:     Record<string, string>;    // langCd → translated string
}

/** 3-column label PK */
export interface LblKey {
  lblCd:   string;
  scrnId:  string;
  lblSeCd: string;
}

/** Combine the 3 PK columns into a single row key — LBL_CD alone does not uniquely identify a row */
export function labelRowId(key: LblKey): string {
  return `${key.lblCd}|${key.scrnId}|${key.lblSeCd}`;
}

/** Group flat rows (label × translation) by label */
export function groupLabelRows(rows: LblRow[]): LblMaster[] {
  const map = new Map<string, LblMaster>();
  for (const r of rows) {
    const rowId = labelRowId(r);
    let master = map.get(rowId);
    if (!master) {
      master = {
        rowId,
        lblCd:    r.lblCd,
        scrnId:   r.scrnId,
        lblSeCd:  r.lblSeCd,
        lblExpln: r.lblExpln ?? '',
        trsl:     {},
      };
      map.set(rowId, master);
    }
    if (r.langCd) master.trsl[r.langCd] = r.trslLtr ?? '';
  }
  return [...map.values()];
}

// ── API functions ────────────────────────────────────────────────────────────
// Server returns only { status, message, data } without a success field —
// populate success here since useApiQuery / useApiMutation check it for pass/fail.

export interface LblRowsParams {
  scrnId?:  string;
  lblCd?:   string;   // partial match
  lblSeCd?: string;
}

/** GET /api/lbl/rows — fetch label-translation list */
export async function getLabelRows(params: LblRowsParams): Promise<ApiResponse<LblRow[]>> {
  const { data } = await apiClient.get<ApiResponse<LblRow[]>>('/api/lbl/rows', { params });
  return {
    success: data.status === 200,
    message: data.message,
    data: data.data ?? [],
  };
}

/**
 * POST /api/lbl/batch — batch save (upsert) labels/translations.
 *
 * Server upserts LANG_LBL for each item, and also upserts LANG_LBL_TRSL if langCd/trslLtr is present.
 * Therefore **lblExpln must always be included** even when saving translations only — omitting it clears the description.
 */
export async function saveLabelBatch(items: LblRow[]): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<ApiResponse<void>>('/api/lbl/batch', items);
  return { success: data.status === 200, message: data.message, data: null };
}

/** DELETE /api/lbl — delete label. Translations are also deleted together */
export async function deleteLabel(key: LblKey): Promise<ApiResponse<void>> {
  const { data } = await apiClient.delete<ApiResponse<void>>('/api/lbl', { params: key });
  return { success: data.status === 200, message: data.message, data: null };
}
