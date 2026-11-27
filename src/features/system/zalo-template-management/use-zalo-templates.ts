import { useEffect, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/use-api-query';
import { useApiAction, useApiDownload } from '@/hooks/use-api-action';
import type { PageQuery, PageResponse } from '@/api/common/api-utils';
import {
  changeZaloTemplateUse,
  createZaloTemplate,
  downloadZaloTemplatesExcel,
  getZaloTemplateHistory,
  getZaloTemplates,
  previewZaloTemplate,
  testSendZaloTemplate,
  updateZaloTemplate,
} from '@/api/system/zalo-api';
import type {
  CreateZaloTemplateRequest,
  ZaloChangeHistory,
  ZaloPreview,
  ZaloPreviewRequest,
  ZaloTemplate,
  ZaloTemplateRequest,
  ZaloTemplateSearch,
} from '@/api/system/zalo-api';
import type { YesNo } from '@/config/sys-constants';

// Data hooks of Zalo Templates (menu A09050400).

/** Wait after the last keystroke before asking the server for a new preview. */
const PREVIEW_DELAY_MS = 500;

const ZALO_TEMPLATE_KEYS = {
  all: ['system', 'zalo-templates'] as const,
  list: (search: ZaloTemplateSearch, query: PageQuery) => ['system', 'zalo-templates', 'list', search, query] as const,
  history: (tplCd: string | null) => ['system', 'zalo-templates', 'history', tplCd] as const,
};

export function useZaloTemplates(search: ZaloTemplateSearch, query: PageQuery) {
  return useApiQuery<PageResponse<ZaloTemplate>>(
    ZALO_TEMPLATE_KEYS.list(search, query),
    () => getZaloTemplates(search, query),
    { placeholderData: keepPreviousData },
  );
}

/** Always loaded for the selected template: the tab label shows the count. */
export function useZaloTemplateHistory(tplCd: string | null) {
  return useApiQuery<ZaloChangeHistory[]>(ZALO_TEMPLATE_KEYS.history(tplCd), () => getZaloTemplateHistory(tplCd as string), {
    enabled: tplCd !== null,
  });
}

export function useDownloadZaloTemplatesExcel() {
  return useApiDownload(downloadZaloTemplatesExcel);
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

/** [Activate] / [Deactivate] of the detail panel. */
export function useChangeZaloTemplateUse() {
  return useApiAction(({ tplCd, useYn }: { tplCd: string; useYn: YesNo }) => changeZaloTemplateUse(tplCd, useYn), {
    invalidate: [ZALO_TEMPLATE_KEYS.all],
  });
}

/** Fills the variables with the server sample data; nothing is saved. */
export function usePreviewZaloTemplate() {
  return useApiAction((request: ZaloPreviewRequest) => previewZaloTemplate(request));
}

/**
 * Live phone preview: the server renders the content with sample data shortly after it stops changing.
 * An empty content shows the empty phone, whatever was rendered before.
 */
export function useLiveZaloPreview(tplCn: string) {
  const preview = usePreviewZaloTemplate();
  const [result, setResult] = useState<ZaloPreview | null>(null);
  const render = preview.mutateAsync;
  useEffect(() => {
    if (!tplCn.trim()) return undefined;
    const timer = window.setTimeout(() => {
      render({ tplCn })
        .then((response) => setResult(response.data ?? null))
        .catch(() => undefined);
    }, PREVIEW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [tplCn, render]);
  return { preview: tplCn.trim() ? result : null, loading: preview.isPending };
}

/** Sends the saved template to one phone (simulated in demo mode). */
export function useTestSendZaloTemplate() {
  return useApiAction(({ tplCd, phone }: { tplCd: string; phone: string }) => testSendZaloTemplate(tplCd, phone));
}
