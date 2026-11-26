import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction } from '@/hooks/use-api-action';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import {
  changeZaloTemplateUse,
  createZaloTemplate,
  getZaloTemplate,
  getZaloTemplates,
  previewZaloTemplate,
  testSendZaloTemplate,
  updateZaloTemplate,
} from '@/api/system/zalo-api';
import type {
  CreateZaloTemplateRequest,
  ZaloPreviewRequest,
  ZaloTemplate,
  ZaloTemplateRequest,
  ZaloTemplateSearch,
} from '@/api/system/zalo-api';
import type { YesNo } from '@/config/sys-constants';

// Data hooks of Zalo Templates (menu A09050400).

const ZALO_TEMPLATE_KEYS = {
  all: ['system', 'zalo-templates'] as const,
  list: (search: ZaloTemplateSearch, query: PageQuery) => ['system', 'zalo-templates', 'list', search, query] as const,
  detail: (tplCd: string | null) => ['system', 'zalo-templates', 'detail', tplCd] as const,
};

export function useZaloTemplates(search: ZaloTemplateSearch, query: PageQuery) {
  return useApiQuery<PageResponse<ZaloTemplate>>(
    ZALO_TEMPLATE_KEYS.list(search, query),
    () => getZaloTemplates(search, query),
    { placeholderData: keepPreviousData },
  );
}

/** One template for the edit popup; skipped while `tplCd` is null (register). */
export function useZaloTemplate(tplCd: string | null) {
  return useApiQuery<ZaloTemplate>(ZALO_TEMPLATE_KEYS.detail(tplCd), () => getZaloTemplate(tplCd as string), {
    enabled: tplCd !== null,
    gcTime: 0,
  });
}

export type SaveZaloTemplateVariables =
  | { tplCd: null; request: CreateZaloTemplateRequest }
  | { tplCd: string; request: ZaloTemplateRequest };

/** Registers (tplCd null) or edits a template. */
export function useSaveZaloTemplate() {
  return useApiAction(
    (variables: SaveZaloTemplateVariables) =>
      variables.tplCd === null ? createZaloTemplate(variables.request) : updateZaloTemplate(variables.tplCd, variables.request),
    { invalidate: [ZALO_TEMPLATE_KEYS.all] },
  );
}

/** Quick on / off switch of the list. */
export function useChangeZaloTemplateUse() {
  return useApiAction(({ tplCd, useYn }: { tplCd: string; useYn: YesNo }) => changeZaloTemplateUse(tplCd, useYn), {
    invalidate: [ZALO_TEMPLATE_KEYS.all],
  });
}

/** Fills the variables with the server sample data; nothing is saved. */
export function usePreviewZaloTemplate() {
  return useApiAction((request: ZaloPreviewRequest) => previewZaloTemplate(request));
}

/** Sends the saved template to one phone (simulated in demo mode). */
export function useTestSendZaloTemplate() {
  return useApiAction(({ tplCd, phone }: { tplCd: string; phone: string }) => testSendZaloTemplate(tplCd, phone));
}
