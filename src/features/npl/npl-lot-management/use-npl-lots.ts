import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import { createNplLot, deleteNplLot, downloadNplLotsExcel, getNplLots, updateNplLot } from '@/api/npl/npl-api';
import type { NplLotItem, NplLotSearch } from '@/api/npl/npl-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of NPL LOT Change Management — the screen never calls the API itself.

const NPL_LOT_KEYS = {
  all: ['npl', 'lots'] as const,
  list: (search: NplLotSearch, page: number, size: number) => ['npl', 'lots', 'list', search, page, size] as const,
};

/** Paged NPL LOT list. */
export function useNplLots(search: NplLotSearch, page: number, size: number) {
  return useApiQuery<PageResponse<NplLotItem>>(NPL_LOT_KEYS.list(search, page, size), () => getNplLots(search, page, size), {
    placeholderData: keepPreviousData,
  });
}

export function useDeleteNplLot() {
  return useApiAction(deleteNplLot, { invalidate: [NPL_LOT_KEYS.all] });
}

export function useDownloadNplLotsExcel() {
  return useApiDownload((search: NplLotSearch) => downloadNplLotsExcel(search as Record<string, unknown>));
}

export interface SaveNplLotVariables {
  /** null = register. */
  bndLotId: string | null;
  /** Only sent on register. */
  bndLotNo?: string;
  bndLotNm: string;
  bndLotExpln?: string;
}

/** Registers / edits an NPL LOT. */
export function useSaveNplLot() {
  return useApiAction(
    ({ bndLotId, bndLotNo, bndLotNm, bndLotExpln }: SaveNplLotVariables) =>
      bndLotId === null
        ? createNplLot({ bndLotNo, bndLotNm, bndLotExpln })
        : updateNplLot(bndLotId, { bndLotNm, bndLotExpln }),
    { invalidate: [NPL_LOT_KEYS.all] },
  );
}
