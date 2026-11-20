import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import { deleteDebtors, downloadDebtorsExcel, getDebtor, getDebtors } from '@/api/npl/npl-api';
import type { DebtorItem, DebtorSearch } from '@/api/npl/npl-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Debtor Management — the screen never calls the API itself.

const DEBTOR_KEYS = {
  all: ['npl', 'debtors'] as const,
  list: (search: DebtorSearch, page: number, size: number) => ['npl', 'debtors', 'list', search, page, size] as const,
  detail: (dbtrCd: string | null) => ['npl', 'debtors', 'detail', dbtrCd] as const,
};

/** Paged debtor list. */
export function useDebtors(search: DebtorSearch, page: number, size: number) {
  return useApiQuery<PageResponse<DebtorItem>>(DEBTOR_KEYS.list(search, page, size), () => getDebtors(search, page, size), {
    placeholderData: keepPreviousData,
  });
}

/** One debtor; skipped while `dbtrCd` is empty. */
export function useDebtor(dbtrCd: string | null) {
  return useApiQuery<Record<string, unknown>>(DEBTOR_KEYS.detail(dbtrCd), () => getDebtor(dbtrCd as string), {
    enabled: !!dbtrCd,
  });
}

export function useDeleteDebtors() {
  return useApiAction(deleteDebtors, { invalidate: [DEBTOR_KEYS.all] });
}

export function useDownloadDebtorsExcel() {
  return useApiDownload((search: DebtorSearch) => downloadDebtorsExcel(search as Record<string, unknown>));
}
