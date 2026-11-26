import type { ZaloUser } from '@/api/system/zalo-api';
import { StatusBadge } from '@/components/common/sys-ui/SysListUi';
import { codeLabel } from '@/lib/i18n/code-label';

/** Linked (auto) / Linked (manual) / Pending link. */
export default function ZaloLinkStateBadge({ user }: { user: ZaloUser }) {
  if (user.linkStatus !== 'LINKED') return <StatusBadge tone="orange">{codeLabel('zalo.linkState', 'PENDING')}</StatusBadge>;
  const method = user.linkMthdCd ?? 'MANUAL';
  return <StatusBadge tone={method === 'AUTO' ? 'green' : 'blue'}>{codeLabel('zalo.linkState', method)}</StatusBadge>;
}
