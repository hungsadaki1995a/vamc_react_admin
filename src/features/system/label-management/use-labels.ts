import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useLabelStore } from '@/stores/label-store';
import { getLanguages } from '@/api/common/label-bulk-api';
import type { LangItem } from '@/api/common/label-bulk-api';
import { deleteLabel, getLabelRows, groupLabelRows, saveLabelBatch } from '@/api/system/label-management-api';
import type { LblKey, LblMaster, LblRow, LblRowsParams } from '@/api/system/label-management-api';

// Data hooks of Multilingual Label Management (A06040300).

const LABEL_KEYS = {
  all: ['system', 'labels'] as const,
  languages: ['system', 'labels', 'languages'] as const,
  rows: ['system', 'labels', 'rows'] as const,
  list: (search: LblRowsParams | null) => ['system', 'labels', 'rows', search] as const,
};

const NO_ROWS: LblRow[] = [];

/** Translation languages defined by LANG_MNG. */
export function useLabelLanguages() {
  return useApiQuery<LangItem[]>(LABEL_KEYS.languages, () => getLanguages());
}

/** Labels grouped per 3-column PK; nothing is fetched until a search is applied (`search` null). */
export function useLabelMasters(search: LblRowsParams | null) {
  const { data: rows = NO_ROWS, isLoading } = useApiQuery<LblRow[]>(
    LABEL_KEYS.list(search),
    () => getLabelRows(search ?? {}),
    { enabled: search !== null },
  );
  const masters = useMemo<LblMaster[]>(() => (search === null ? [] : groupLabelRows(rows)), [rows, search]);
  return { masters, isLoading };
}

/**
 * Refreshes both cache layers after a write.
 *
 * 1. react-query: the key includes the search conditions, so the row lists are invalidated by prefix.
 * 2. labelStore: app-wide label map; the client cache (IndexedDB, 5-min TTL) is force-cleared.
 */
function useInvalidateLabels() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: LABEL_KEYS.rows });
    void useLabelStore.getState().invalidateLabelCache();
  };
}

/** Batch upsert of labels / translations. */
export function useSaveLabels() {
  const invalidate = useInvalidateLabels();
  return useApiMutation<void, LblRow[]>(saveLabelBatch, { onSuccess: invalidate });
}

/** Deletes a label together with its translations. */
export function useDeleteLabel() {
  const invalidate = useInvalidateLabels();
  return useApiMutation<void, LblKey>(deleteLabel, { onSuccess: invalidate });
}
