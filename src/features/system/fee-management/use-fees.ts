import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import {
  changeFeeUse,
  createFee,
  deleteFees,
  downloadFeeExcel,
  getFee,
  getFees,
  updateFee,
} from '@/api/system/fee-api';
import type { Fee, FeeRequest, FeeSearch, YesNo } from '@/api/system/fee-api';

// Data hooks of Fee Management (VPA09010301 / VPA090103P01) — the screen never calls the API itself.

const FEE_KEYS = {
  all: ['system', 'fees'] as const,
  list: (search: FeeSearch, query: PageQuery) => ['system', 'fees', 'list', search, query] as const,
  detail: (feeId: string | null) => ['system', 'fees', 'detail', feeId] as const,
};

/** Paged fee list (20 rows; default server order is batch / type / order unless `sortBy` is set). */
export function useFees(search: FeeSearch, query: PageQuery) {
  return useApiQuery<PageResponse<Fee>>(FEE_KEYS.list(search, query), () => getFees(search, query), {
    placeholderData: keepPreviousData,
  });
}

/** One fee item for the edit popup; skipped while `feeId` is null (register). */
export function useFee(feeId: string | null) {
  return useApiQuery<Fee>(FEE_KEYS.detail(feeId), () => getFee(feeId as string), {
    enabled: feeId !== null,
    gcTime: 0,
  });
}

export interface SaveFeeVariables {
  /** null = register. */
  feeId: string | null;
  request: FeeRequest;
}

/** Registers / edits a fee item in one call (Use included). */
export function useSaveFee() {
  return useApiAction(
    ({ feeId, request }: SaveFeeVariables) => (feeId === null ? createFee(request) : updateFee(feeId, request)),
    { invalidate: [FEE_KEYS.all] },
  );
}

/** Use switch of a legacy `MDT` item (PUT rejects that type). */
export function useChangeFeeUse() {
  return useApiAction(({ feeId, useYn }: { feeId: string; useYn: YesNo }) => changeFeeUse([feeId], useYn), {
    invalidate: [FEE_KEYS.all],
  });
}

/** Deletes a legacy `MDT` item (not in use, not referenced). */
export function useDeleteFee() {
  return useApiAction((feeId: string) => deleteFees([feeId]), { invalidate: [FEE_KEYS.all] });
}

/** [Excel Download] of the searched list. */
export function useDownloadFeeExcel() {
  return useApiDownload((search: FeeSearch) => downloadFeeExcel(search));
}
