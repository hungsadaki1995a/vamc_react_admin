import { useTranslation } from 'react-i18next';
import type { ZaloChannel } from '@/api/system/zalo-limit-api';
import { StatusBadge } from '@/components/common/sys-ui/SysListUi';

// Zalo channel state: Sending / Stopped (all sends) / ZNS stopped (paid sends only).

export default function ZaloChannelBadge({ channel }: { channel: ZaloChannel | undefined }) {
  const { t } = useTranslation();
  if (!channel) return <StatusBadge>-</StatusBadge>;
  if (channel.stopYn !== 'Y') return <StatusBadge tone="green">{t('zalo.limits.channel.sending')}</StatusBadge>;
  return (
    <StatusBadge tone="red">
      {t(channel.stopScopeCd === 'ZNS' ? 'zalo.limits.channel.znsStopped' : 'zalo.limits.channel.allStopped')}
    </StatusBadge>
  );
}
