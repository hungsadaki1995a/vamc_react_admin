import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppRadio from '@/components/inputs/AppRadio';
import { useNotify } from '@/hooks/use-notify';
import type { YesNo } from '@/config/sys-constants';
import type { ZaloResumeMethod, ZaloStopScope } from '@/api/system/zalo-limit-api';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { codeLabel } from '@/lib/i18n/code-label';
import { errorMessage } from '@/utils/system-utils';
import { useStopZaloChannel } from './use-zalo-limits';
import styles from './zalo-limit-management.module.scss';

// Zalo Sending Limits - [Stop] of the Zalo Channel cell: stops all Zalo sends or the paid ZNS ones at once, on every
// server. Held sends are logged as failed (channel stopped) and never resent; e-mail templates still go out.

/** Reasons offered by the design; the chosen text is stored with the stop. */
const REASON_KEYS = ['budget', 'content', 'incident', 'abuse'] as const;

export default function ZaloStopModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const stop = useStopZaloChannel();
  const [scope, setScope] = useState<ZaloStopScope>('ALL');
  const [otpKeepYn, setOtpKeepYn] = useState<YesNo>('Y');
  const [resume, setResume] = useState<ZaloResumeMethod>('MANUAL');
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);

  const effect = [
    t(scope === 'ALL' ? 'zalo.limits.stop.effectAll' : 'zalo.limits.stop.effectZns'),
    t(otpKeepYn === 'Y' ? 'zalo.limits.stop.effectKeepOtp' : 'zalo.limits.stop.effectStopOtp'),
    t('zalo.limits.stop.effectHeld'),
    resume === 'MANUAL'
      ? t('zalo.limits.stop.effectManual')
      : t('zalo.limits.stop.effectAuto', { when: codeLabel('zalo.resumeMethods', resume).toLowerCase() }),
  ].join(' ');

  const handleSubmit = async () => {
    setTried(true);
    if (!reason) return;
    try {
      await stop.mutateAsync({ stopScopeCd: scope, otpKeepYn, rsmptMthdCd: resume, stopRsn: reason });
      toast.success(t('messages.zalo.limits.stopped'));
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <SysFormModal
      open
      width={720}
      title={t('zalo.limits.stop.title')}
      submitText={t('zalo.limits.stop.submit')}
      onSubmit={() => void handleSubmit()}
      submitting={stop.isPending}
      onCancel={onClose}
      notice={effect}
    >
      <SysFieldGrid columns={1} labelWidth={150}>
        <SysField label={t('zalo.limits.stop.scope')} required>
          <AppRadio.Group
            value={scope}
            aria-label={t('zalo.limits.stop.scope')}
            options={(['ALL', 'ZNS'] as ZaloStopScope[]).map((code) => ({ value: code, label: codeLabel('zalo.stopScopes', code) }))}
            onChange={(e) => setScope(e.target.value as ZaloStopScope)}
          />
        </SysField>
        <SysField label={t('zalo.limits.stop.otp')} required>
          <AppRadio.Group
            value={otpKeepYn}
            aria-label={t('zalo.limits.stop.otp')}
            options={[
              { value: 'Y', label: t('zalo.limits.stop.otpKeep') },
              { value: 'N', label: t('zalo.limits.stop.otpStop') },
            ]}
            onChange={(e) => setOtpKeepYn(e.target.value as YesNo)}
          />
        </SysField>
        <SysField label={t('zalo.limits.stop.resume')} required>
          <AppRadio.Group
            value={resume}
            aria-label={t('zalo.limits.stop.resume')}
            options={(['MANUAL', 'HOUR', 'DAY'] as ZaloResumeMethod[]).map((code) => ({
              value: code,
              label: codeLabel('zalo.resumeMethods', code),
            }))}
            onChange={(e) => setResume(e.target.value as ZaloResumeMethod)}
          />
        </SysField>
        <SysField
          label={t('zalo.limits.stop.reason')}
          required
          error={tried && !reason ? t('messages.zalo.limits.selectReason') : undefined}
        >
          <AppRadio.Group
            className={styles.reasonChips}
            value={reason}
            optionType="button"
            buttonStyle="solid"
            aria-label={t('zalo.limits.stop.reason')}
            options={REASON_KEYS.map((key) => {
              const label = t(`zalo.limits.stop.reasons.${key}`);
              return { value: label, label };
            })}
            onChange={(e) => setReason(String(e.target.value))}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
