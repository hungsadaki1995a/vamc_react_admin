import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

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
