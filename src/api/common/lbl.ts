import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

/**
 * 다국어 라벨(LBL) 공용 API — 여러 화면이 공유하는 호출만 둔다.
 * 라벨 관리 화면 전용 CRUD 는 `src/features/sys/SYS050301SC/api.ts` 에 있다.
 */

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
