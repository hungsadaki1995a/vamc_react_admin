import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// ─────────────────────────────────────────────────────────────────────────────
// 다국어 라벨 관리 (A06050300) API
//
// 서버 계약은 LANG_LBL / LANG_LBL_TRSL 스키마를 그대로 따른다.
//   · 라벨 식별자는 단일 키가 아니라 PK 3개 (LBL_CD, SCRN_ID, LBL_SE_CD) 다.
//   · 번역은 라벨의 속성이며 (LANG_CD + 위 3개) 로 식별된다.
// 화면에서 쓰던 lblId / lclCd / lblTxt / projTxt (PMS 유래) 는 대응 테이블이 없어 폐기했다.
// ─────────────────────────────────────────────────────────────────────────────

/** 라벨-번역 1행 — 서버 LblSaveItem 과 1:1. 번역이 없는 라벨은 langCd/trslLtr 가 비어서 온다. */
export interface LblRow {
  lblCd:     string;   // 라벨코드 (전역 유일 규약 — 화면 라벨은 sceId 접두)
  scrnId:    string;   // 화면아이디
  lblSeCd:   string;   // 라벨구분코드
  lblExpln?: string;   // 라벨설명 (기본 텍스트)
  langCd?:   string;   // 언어코드 KR/EN/VN
  trslLtr?:  string;   // 번역문자
}

/** 좌측 그리드 1행 — 라벨 1건 + 언어별 번역 맵 */
export interface LblMaster {
  rowId:    string;                    // `${lblCd}|${scrnId}|${lblSeCd}` — AG Grid 행 키
  lblCd:    string;
  scrnId:   string;
  lblSeCd:  string;
  lblExpln: string;
  trsl:     Record<string, string>;    // langCd → 번역문자
}

// 사용 언어 목록(LangItem / getLanguages)은 메뉴 설정 화면도 쓰므로
// 공용 API `@/api/common/lbl` 로 승격했다. 화면 코드가 그대로 쓰도록 여기서 재노출한다.
export type { LangItem } from '@/api/common/lbl';
export { getLanguages } from '@/api/common/lbl';

/** 라벨 PK 3개 */
export interface LblKey {
  lblCd:   string;
  scrnId:  string;
  lblSeCd: string;
}

/** PK 3개를 하나의 행 키로 — LBL_CD 만으로는 행이 특정되지 않는다 */
export function labelRowId(key: LblKey): string {
  return `${key.lblCd}|${key.scrnId}|${key.lblSeCd}`;
}

/** 평면 행(라벨×번역) → 라벨 단위로 묶기 */
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

// ── API 함수 ────────────────────────────────────────────────────────────────
// 서버는 { status, message, data } 만 내려주고 success 필드가 없다 —
// useApiQuery / useApiMutation 이 success 로 성패를 판단하므로 여기서 만들어 채운다.

export interface LblRowsParams {
  scrnId?:  string;
  lblCd?:   string;   // 부분일치
  lblSeCd?: string;
}

/** 라벨-번역 목록 조회 */
export async function getLabelRows(params: LblRowsParams): Promise<ApiResponse<LblRow[]>> {
  const { data } = await apiClient.get<ApiResponse<LblRow[]>>('/api/lbl/rows', { params });
  return {
    success: data.status === 200,
    message: data.message,
    data: data.data ?? [],
  };
}

/**
 * 라벨/번역 배치 저장 (upsert).
 *
 * 서버는 항목마다 LANG_LBL 을 upsert 한 뒤 langCd/trslLtr 가 있으면 LANG_LBL_TRSL 도 upsert 한다.
 * 따라서 번역만 저장할 때도 **lblExpln 을 반드시 실어 보내야 한다** — 비우면 라벨설명이 지워진다.
 */
export async function saveLabelBatch(items: LblRow[]): Promise<ApiResponse<void>> {
  const { data } = await apiClient.post<ApiResponse<void>>('/api/lbl/batch', items);
  return { success: data.status === 200, message: data.message, data: null };
}

/** 라벨 삭제 — 번역까지 함께 삭제된다 */
export async function deleteLabel(key: LblKey): Promise<ApiResponse<void>> {
  const { data } = await apiClient.delete<ApiResponse<void>>('/api/lbl', { params: key });
  return { success: data.status === 200, message: data.message, data: null };
}
