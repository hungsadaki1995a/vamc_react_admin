import { useApiAction, useApiTask } from '@/hooks/use-api-action';
import {
  attachTradeApplicationScans,
  cancelTradeApplication,
  checkTradeApplicationDocuments,
} from '@/api/trade/trade-api';
import type { TradeAppKind } from '@/api/trade/trade-api';
import { uploadTradeFiles } from '@/api/trade/trade-file-api';
import { openAttachment } from '@/api/common/attachment-api';
import { AFTER_WRITE } from './use-trade-applications';

// Write hooks of the application processing popup (VPA050101P01 / 050102P01 / 050103P01).

interface Target {
  kind: TradeAppKind;
  id: string;
}

/**
 * I11 / I11-1c: uploads the scans (scope `application`) and attaches the group to the application. Appends to the
 * application's existing group when it has one, so earlier scans are kept.
 */
export function useUploadApplicationScans() {
  return useApiTask(
    async ({ kind, id, files, fileUnqId }: Target & { files: File[]; fileUnqId?: string }) => {
      const group = await uploadTradeFiles(kind, 'application', files, fileUnqId);
      await attachTradeApplicationScans(kind, id, group.fileUnqId);
      return group;
    },
    { invalidate: AFTER_WRITE },
  );
}

export function useCheckApplicationDocuments() {
  return useApiAction(
    ({ kind, id, complete, missingNote }: Target & { complete: boolean; missingNote?: string }) =>
      checkTradeApplicationDocuments(kind, id, complete, missingNote),
    { invalidate: AFTER_WRITE },
  );
}

export function useCancelApplication() {
  return useApiAction(({ kind, id, reason }: Target & { reason: string }) => cancelTradeApplication(kind, id, reason), {
    invalidate: AFTER_WRITE,
  });
}

/** Opens a scan (`previewUrl` / `downloadUrl` need the bearer token, so no plain link). */
export function useOpenTradeFile() {
  return useApiTask((url: string) => openAttachment(url));
}
