import i18n from '@/lib/i18n';
import type { ZaloSendResult } from '@/api/system/zalo-api';

// Toast text of a Zalo sending (Zalo Users invitation, Zalo Templates test send).

/** "Sent (simulated). Message id: MOCK-…" in demo mode, "Sent. Message id: …" otherwise. */
export function sentMessage(result: ZaloSendResult | null | undefined): string {
  const id = result?.extMsgId ?? result?.logId ?? '-';
  return result?.mock ? i18n.t('messages.zalo.sentMock', { id }) : i18n.t('messages.zalo.sent', { id });
}
