import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import { IS_MOCK_MODE, mockFetchBulkLabels } from '@/mocks';

/**
 * Bulk load all labels for the current locale and project.
 * GET /api/lbl/bulk — no auth required (permitAll in SecurityConfig).
 * projId (X-Project-Id) and lclCd (X-Lang) are injected automatically by the axios interceptor.
 */
export async function fetchBulkLabels(): Promise<Record<string, string>> {
  if (IS_MOCK_MODE) return mockFetchBulkLabels();

  const { data } = await apiClient.get<ApiResponse<Record<string, string>>>('/api/lbl/bulk');
  if (data.status !== 200 || !data.data) return {};
  return data.data;
}
