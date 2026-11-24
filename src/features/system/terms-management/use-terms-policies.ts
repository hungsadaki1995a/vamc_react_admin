import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import {
  createTermsPolicy,
  deleteTermsPolicies,
  getTermsPolicies,
  getTermsPolicy,
  updateTermsPolicy,
} from '@/api/system/terms-api';
import type {
  TermsPolicyDetail,
  TermsPolicyItem,
  TermsPolicySearch,
  UpdateTermsPolicyRequest,
} from '@/api/system/terms-api';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';

// Data hooks of Terms Management (menu A09010700).

const TERMS_KEYS = {
  all: ['system', 'terms'] as const,
  list: (search: TermsPolicySearch, page: PageQuery) => ['system', 'terms', 'list', search, page] as const,
  detail: (termsId: string | null) => ['system', 'terms', 'detail', termsId] as const,
};

/** Newest effective date first unless `sortBy` is set. */
export function useTermsPolicies(search: TermsPolicySearch, page: PageQuery) {
  return useApiQuery<PageResponse<TermsPolicyItem>>(TERMS_KEYS.list(search, page), () => getTermsPolicies(search, page), {
    placeholderData: keepPreviousData,
  });
}

/** Detail with VN / EN content; skipped while no row is open. */
export function useTermsPolicy(termsId: string | null) {
  return useApiQuery<TermsPolicyDetail>(TERMS_KEYS.detail(termsId), () => getTermsPolicy(termsId as string), {
    enabled: !!termsId,
    refetchOnWindowFocus: false,
  });
}

export function useCreateTermsPolicy() {
  return useApiAction(createTermsPolicy, { invalidate: [TERMS_KEYS.all] });
}

export function useUpdateTermsPolicy() {
  return useApiAction(
    ({ termsId, request }: { termsId: string; request: UpdateTermsPolicyRequest }) => updateTermsPolicy(termsId, request),
    { invalidate: [TERMS_KEYS.all] },
  );
}

export function useDeleteTermsPolicy() {
  return useApiAction((termsId: string) => deleteTermsPolicies([termsId]), { invalidate: [TERMS_KEYS.all] });
}
