import { useTranslation } from 'react-i18next';
import { useNotify } from '@/hooks/use-notify';
import type { ZaloChannel } from '@/api/system/zalo-limit-api';
import { SysButton } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { codeLabel } from '@/lib/i18n/code-label';
import { errorMessage, formatSysDateTime } from '@/utils/system-utils';
import { actorText } from '../_shared/zalo-messages';
import ZaloChannelBadge from './ZaloChannelBadge';
import { num } from './zalo-limit-constants';
import { useResumeZaloChannel } from './use-zalo-limits';

// Zalo Sending Limits - [Resume] of the Zalo Channel cell while stopped: how and why it was stopped, the sends held
// since then (never resent) and [Resume Sending].

interface ZaloChannelStatusModalProps {
  channel: ZaloChannel;
  canWrite: boolean;
  onClose: () => void;
}

export default function ZaloChannelStatusModal({ channel, canWrite, onClose }: ZaloChannelStatusModalProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const resume = useResumeZaloChannel();

  const handleResume = async () => {
    try {
      await resume.mutateAsync();
      toast.success(t('messages.zalo.limits.resumed'));
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const method = codeLabel('zalo.resumeMethods', channel.rsmptMthdCd ?? 'MANUAL');
  const resumeText = channel.rsmptPrnmntDt ? `${method} · ${formatSysDateTime(channel.rsmptPrnmntDt)}` : method;

  return (
    <SysFormModal
      open
      width={640}
      title={t('zalo.limits.channel.title')}
      onCancel={onClose}
      extraActions={
        canWrite && (
          <SysButton look="primary" loading={resume.isPending} onClick={() => void handleResume()}>
            {t('zalo.limits.channel.resumeNow')}
          </SysButton>
        )
      }
    >
      <SysFieldGrid columns={1} labelWidth={150}>
        <SysField label={t('zalo.limits.channel.status')}>
          <ZaloChannelBadge channel={channel} />
        </SysField>
        <SysField label={t('zalo.limits.channel.stopped')}>
          {`${formatSysDateTime(channel.stopDt)} · ${actorText(channel.stopBy)}`}
        </SysField>
        <SysField label={t('zalo.limits.stop.otp')}>
          {t(channel.otpKeepYn === 'N' ? 'zalo.limits.channel.otpStopped' : 'zalo.limits.channel.otpSent')}
        </SysField>
        <SysField label={t('zalo.limits.stop.resume')}>{resumeText}</SysField>
        <SysField label={t('zalo.limits.stop.reason')}>{channel.stopRsn || '-'}</SysField>
        <SysField label={t('zalo.limits.channel.held')}>
          <span>
            <strong>{num(channel.heldCount)}</strong> {t('zalo.limits.channel.heldNote')}
          </span>
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
