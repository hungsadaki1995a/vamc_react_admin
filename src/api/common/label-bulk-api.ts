import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

// ─────────────────────────────────────────────────────────────────────────────
// Multilingual label (LANG_LBL) bulk lookup API — global domain.
//
// Fetches all labels for the current locale at once on app bootstrap and stores them in labelStore cache.
// Supported language list (LANG_MNG) is also placed here as it is shared across screens.
//
// ⚠️ CRUD for the label management screen (SYS050301SC) is in `src/api/sys/lblMngApi.ts`.
// ─────────────────────────────────────────────────────────────────────────────

/** Single supported language entry (LANG_MNG) */
export interface LangItem {
  langCd:   string;
  langNm:   string;
  sortSeq?: number;
}

/** GET /api/lbl/languages — supported language list (LANG_MNG) */
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
