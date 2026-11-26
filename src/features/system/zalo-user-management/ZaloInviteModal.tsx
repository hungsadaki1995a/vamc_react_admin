import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import { ZALO_ERRORS } from '@/api/system/zalo-api';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { apiErrorCode, errorMessage } from '@/utils/system-utils';
import { sentMessage } from '../_shared/zalo-messages';
import { useSendZaloInvitation } from './use-zalo-users';

// Zalo Users - link invitation popup (ZNS template MBR_JOIN_WELCOME with the OA follow link). A channel stop (ZAL016)
// or a limit rule (ZAL017, the server message names the rule) blocks it.

type FieldKey = 'phone' | 'recipientName';

const BLOCKING_ERRORS: string[] = [ZALO_ERRORS.channelStopped, ZALO_ERRORS.limitExceeded];

export default function ZaloInviteModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const { alert } = useSysDialogs();
  const invite = useSendZaloInvitation();
  const { errors, clearError, checkRequired, applyApiError } = useFieldErrors<FieldKey>();
  const [values, setValues] = useState({ phone: '', recipientName: '' });

  const patch = (key: FieldKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const handleSubmit = async () => {
    if (!checkRequired(values, ['phone'])) return;
    try {
      const response = await invite.mutateAsync({
        phone: values.phone.trim(),
        recipientName: values.recipientName.trim() || undefined,
      });
      toast.success(sentMessage(response.data));
      onClose();
    } catch (error) {
      const handled = applyApiError(error, { [ZALO_ERRORS.invalidPhone]: ['phone', t('messages.zalo.invalidPhone')] });
      if (handled) return;
      const code = apiErrorCode(error);
      if (code && BLOCKING_ERRORS.includes(code)) alert(errorMessage(error));
      else toast.error(errorMessage(error));
    }
  };

  return (
    <SysFormModal
      open
      width={720}
      title={t('zalo.users.invite.title')}
      submitText={t('zalo.common.send')}
      onSubmit={handleSubmit}
      submitting={invite.isPending}
      onCancel={onClose}
      notice={t('zalo.users.invite.notice')}
    >
      <SysFieldGrid columns={1} labelWidth={140}>
        <SysField label={t('zalo.common.phone')} required error={errors.phone}>
          <TextInput
            value={values.phone}
            maxLength={20}
            placeholder={t('zalo.common.phonePlaceholder')}
            onChange={(e) => patch('phone', e.target.value)}
          />
        </SysField>
        <SysField label={t('zalo.users.invite.recipientName')} error={errors.recipientName}>
          <TextInput
            value={values.recipientName}
            maxLength={100}
            placeholder={t('zalo.users.invite.recipientNamePlaceholder')}
            onChange={(e) => patch('recipientName', e.target.value)}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
