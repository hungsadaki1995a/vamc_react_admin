import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// ─────────────────────────────────────────────────────────────────────────────
// 다국어 라벨(LANG_LBL) 일괄 조회 API — 전역 도메인.
//
// 앱 부트스트랩 시 현재 로케일의 라벨 전체를 한 번에 받아 labelStore 캐시에 넣는다.
// 사용 언어 목록(LANG_MNG)도 여러 화면이 공유하므로 여기 둔다.
//
// ⚠️ 라벨을 **관리**하는 화면(SYS050301SC)의 CRUD 는 `src/api/sys/lblMngApi.ts` 다.
// ─────────────────────────────────────────────────────────────────────────────

/** 사용 언어 목록 1건 (LANG_MNG) */
export interface LangItem {
  langCd:   string;
  langNm:   string;
  sortSeq?: number;
}

/** GET /api/lbl/languages — 사용 언어 목록 (LANG_MNG) */
export async function getLanguages(): Promise<ApiResponse<LangItem[]>> {
  const { data } = await apiClient.get<ApiResponse<LangItem[]>>('/api/lbl/languages');
  return {
    success: data.status === 200,
    message: data.message,
    data: data.data ?? [],
  };
}

/**
 * Bulk load all labels for the current locale and project.
 * GET /api/lbl/bulk — no auth required (permitAll in SecurityConfig).
 * projId (X-Project-Id) and lclCd (X-Lang) are injected automatically by the axios interceptor.
 */
export async function fetchBulkLabels(): Promise<Record<string, string>> {
  const { data } = await apiClient.get<ApiResponse<Record<string, string>>>('/api/lbl/bulk');
  if (data.status !== 200 || !data.data) return {};
  return data.data;
}
