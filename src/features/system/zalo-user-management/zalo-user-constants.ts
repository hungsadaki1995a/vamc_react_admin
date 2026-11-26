import type { ZaloUser } from '@/api/system/zalo-api';
import { codeLabel } from '@/lib/i18n/code-label';

// Shared helpers of Zalo Users (menu A09050300).

/** Linked account as "TV00000001 · N***A (Member)"; `-` when not linked. */
export function accountText(user: ZaloUser): string {
  if (!user.userNo) return '-';
  const type = user.userTypeCd ? ` (${codeLabel('zalo.userTypes', user.userTypeCd)})` : '';
  return `${user.userNo}${user.userNm ? ` · ${user.userNm}` : ''}${type}`;
}
