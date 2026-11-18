import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import {
  createTermsPolicy,
  deleteTermsPolicies,
  getTermsPolicies,
  getTermsPolicy,
  publishTermsPolicies,
  updateTermsPolicy,
} from '@/api/system/system-operations-api';
import type {
  TermsPolicyDetail,
  TermsPolicyItem,
  TermsPolicyRequest,
  TermsPolicySearch,
} from '@/api/system/system-operations-api';
import type { PageResponse } from '@/api/common/api-utils';

// Data hooks of Terms Management (menu A06010700).

const TERMS_KEYS = {
  all: ['system', 'terms'] as const,
  list: (search: TermsPolicySearch, page: number, size: number) => ['system', 'terms', 'list', search, page, size] as const,
  detail: (termsId: string | null) => ['system', 'terms', 'detail', termsId] as const,
};

export function useTermsPolicies(search: TermsPolicySearch, page: number, size: number) {
  return useApiQuery<PageResponse<TermsPolicyItem>>(
    TERMS_KEYS.list(search, page, size),
    () => getTermsPolicies(search, page, size),
    { placeholderData: keepPreviousData },
  );
}

/** One terms item; skipped while `termsId` is null (register mode). */
export function useTermsPolicy(termsId: string | null) {
  return useApiQuery<TermsPolicyDetail>(TERMS_KEYS.detail(termsId), () => getTermsPolicy(termsId as string), {
    enabled: termsId !== null,
    gcTime: 0,
  });
}

export interface PublishTermsPoliciesVariables {
  termsIds: string[];
  published: 'Y' | 'N';
}

export function usePublishTermsPolicies() {
  return useApiAction(
    ({ termsIds, published }: PublishTermsPoliciesVariables) => publishTermsPolicies(termsIds, published),
    { invalidate: [TERMS_KEYS.all] },
  );
}

export function useDeleteTermsPolicies() {
  return useApiAction(deleteTermsPolicies, { invalidate: [TERMS_KEYS.all] });
}

export interface SaveTermsPolicyVariables {
  /** null = register. */
  termsId: string | null;
  request: TermsPolicyRequest;
}

/** Registers or edits a terms item. */
export function useSaveTermsPolicy() {
  return useApiAction(
    ({ termsId, request }: SaveTermsPolicyVariables) =>
      termsId === null ? createTermsPolicy(request) : updateTermsPolicy(termsId, request),
    { invalidate: [TERMS_KEYS.all] },
  );
}
