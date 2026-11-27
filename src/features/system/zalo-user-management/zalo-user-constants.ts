import i18n from '@/lib/i18n';
import type { ZaloChangeHistory, ZaloUser } from '@/api/system/zalo-api';
import { codeLabel } from '@/lib/i18n/code-label';

// Shared helpers of Zalo Users (menu A09050300).

/** Linked account as "TV00000001 · N***A (Member)"; `-` when not linked. */
export function accountText(user: ZaloUser): string {
  if (!user.userNo) return '-';
  const type = user.userTypeCd ? ` (${codeLabel('zalo.userTypes', user.userTypeCd)})` : '';
  return `${user.userNo}${user.userNm ? ` · ${user.userNm}` : ''}${type}`;
}

/** History values of a link are stored as "MBR:TV00000001"; shows the account number. */
function accountNo(value?: string | null): string {
  if (!value) return '-';
  const at = value.indexOf(':');
  return at < 0 ? value : value.slice(at + 1);
}

/** Event text of one Link History row (items FOLLOW, SHARE_PHONE, LINK_AUTO, LINK_MANUAL, UNLINK). */
export function historyEventText(row: ZaloChangeHistory): string {
  switch (row.chgItemNm) {
    case 'FOLLOW':
      return i18n.t(row.aftrVal === 'N' ? 'zalo.users.history.unfollow' : 'zalo.users.history.follow');
    case 'SHARE_PHONE':
      return i18n.t('zalo.users.history.sharePhone');
    case 'LINK_AUTO':
      return i18n.t('zalo.users.history.linkAuto', { account: accountNo(row.aftrVal) });
    case 'LINK_MANUAL':
      return i18n.t('zalo.users.history.linkManual', { account: accountNo(row.aftrVal) });
    case 'UNLINK':
      return i18n.t('zalo.users.history.unlink', { account: accountNo(row.bfrVal) });
    default:
      return [row.chgItemNm, row.bfrVal, row.aftrVal].filter(Boolean).join(' · ');
  }
}
