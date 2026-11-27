import i18n from '@/lib/i18n';
import { ZALO_ERRORS } from '@/api/system/zalo-api';
import type { ZaloSendResult } from '@/api/system/zalo-api';
import { apiErrorCode } from '@/utils/system-utils';

// Shared texts of the Zalo screens: sending toasts, blocked sendings and who made a change.

/** "Sent (simulated). Message id: MOCK-…" in demo mode, "Sent. Message id: …" otherwise. */
export function sentMessage(result: ZaloSendResult | null | undefined): string {
  const id = result?.extMsgId ?? result?.logId ?? '-';
  return result?.mock ? i18n.t('messages.zalo.sentMock', { id }) : i18n.t('messages.zalo.sent', { id });
}

/** Author of a change: `SYSTEM` → "system", `ZALO` → "Zalo", otherwise the EMP_NO as sent. */
export function actorText(by?: string | null): string {
  if (!by) return '-';
  if (by === 'SYSTEM') return i18n.t('zalo.common.bySystem');
  if (by === 'ZALO') return i18n.t('zalo.common.byZalo');
  return by;
}

/** Sending blocked by a channel stop (ZAL016) or a limit rule (ZAL017; the server message names the rule). */
export function isBlockedSend(error: unknown): boolean {
  const code = apiErrorCode(error);
  return code === ZALO_ERRORS.channelStopped || code === ZALO_ERRORS.limitExceeded;
}
