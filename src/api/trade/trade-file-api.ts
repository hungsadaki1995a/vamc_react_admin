import { apiClient } from '@/lib/api/client';
import { apiGet } from '@/api/common/api-utils';
import i18n from '@/lib/i18n';
import type { TradeAppKind } from '@/api/trade/trade-api';

// Trade document groups — TradeFileController (/api/v1/trade-files). Scope `application` is guarded by the
// application menu of the kind, `contract` by its contract menu. Used for scans of applications (VPA020600P01).

export type TradeFileScope = 'application' | 'contract';

export interface TradeFileItem {
  fileUnqId: string;
  fileSeq: number;
  fileTypeCd?: string;
  fileNm: string;
  fileExtnNm?: string;
  fileSz?: number;
  downloadUrl?: string;
  previewUrl?: string;
}

export interface TradeFileGroup {
  fileUnqId: string;
  files: TradeFileItem[];
}

const BASE = '/api/v1/trade-files';

/** Uploads files (multipart part `files`) into a new group, or appends to `fileUnqId`; answers the whole group. */
export async function uploadTradeFiles(
  kind: TradeAppKind,
  scope: TradeFileScope,
  files: File[],
  fileUnqId?: string,
): Promise<TradeFileGroup> {
  const body = new FormData();
  files.forEach((file) => body.append('files', file));
  const { data } = await apiClient.post<{ data?: TradeFileGroup }>(BASE, body, {
    params: { kind, scope, ...(fileUnqId ? { fileUnqId } : {}) },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (!data.data) throw new Error(i18n.t('messages.api.uploadNoFileGroup'));
  return data.data;
}

export const getTradeFiles = (kind: TradeAppKind, scope: TradeFileScope, fileUnqId: string) =>
  apiGet<TradeFileGroup>(`${BASE}/${encodeURIComponent(fileUnqId)}`, { kind, scope });
