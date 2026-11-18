import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiTask } from '@/hooks/use-api-action';
import {
  changeFeeUse,
  createFee,
  deleteFees,
  downloadFeeExcel,
  getFee,
  getFees,
  updateFee,
} from '@/api/system/fee-api';
import type { Fee, FeeRequest, FeeSearch } from '@/api/system/fee-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Fee Management (VPA004101 / VPA0041P01) — the screen never calls the API itself.

const FEE_KEYS = {
  all: ['system', 'fees'] as const,
  list: (search: FeeSearch, page: number, size: number) => ['system', 'fees', 'list', search, page, size] as const,
  detail: (feeId: string | null) => ['system', 'fees', 'detail', feeId] as const,
};

/** Paged fee list. */
export function useFees(search: FeeSearch, page: number, size: number) {
  return useApiQuery<PageResponse<Fee>>(FEE_KEYS.list(search, page, size), () => getFees(search, page, size), {
    placeholderData: keepPreviousData,
  });
}

/** One fee item; skipped while `feeId` is null (register mode). */
export function useFee(feeId: string | null) {
  return useApiQuery<Fee>(FEE_KEYS.detail(feeId), () => getFee(feeId as string), {
    enabled: feeId !== null,
    gcTime: 0,
  });
}

export function useDeleteFees() {
  return useApiAction(deleteFees, { invalidate: [FEE_KEYS.all] });
}

export function useDownloadFeeExcel() {
  return useApiTask(downloadFeeExcel);
}

export interface SaveFeeVariables {
  /** null = register. */
  feeId: string | null;
  /** Omitted when only the usage flag changes (item in use). */
  request?: FeeRequest;
  /** Usage flag to apply after saving; the server always stores new / edited items as N. */
  useYn?: 'Y' | 'N';
}

/** Registers / edits a fee item, then applies the usage flag. */
export function useSaveFee() {
  return useApiTask(
    async ({ feeId, request, useYn }: SaveFeeVariables) => {
      let savedId = feeId;
      if (request) {
        const saved = feeId === null ? await createFee(request) : await updateFee(feeId, request);
        savedId = saved.data?.feeId ?? feeId;
      }
      if (useYn && savedId) await changeFeeUse([savedId], useYn);
    },
    { invalidate: [FEE_KEYS.all] },
  );
}
