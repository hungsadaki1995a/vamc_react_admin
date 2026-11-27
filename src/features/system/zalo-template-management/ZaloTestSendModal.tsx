import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { useSysDialogs } from '@/hooks/use-sys-dialogs';
import { ZALO_ERRORS } from '@/api/system/zalo-api';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { apiErrorCode, errorMessage } from '@/utils/system-utils';
import { isBlockedSend, sentMessage } from '../_shared/zalo-messages';
import { useTestSendZaloTemplate } from './use-zalo-templates';

// Zalo Templates - [Test Send]: the saved template with the sample data to one phone (type TEST; sending limits and
// a channel stop apply). Demo mode: simulated, the sending shows in Notification Send History.

interface ZaloTestSendModalProps {
  tplCd: string;
  onClose: () => void;
}

export default function ZaloTestSendModal({ tplCd, onClose }: ZaloTestSendModalProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const { alert } = useSysDialogs();
  const testSend = useTestSendZaloTemplate();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();

  const handleSubmit = async () => {
    if (!phone.trim()) {
      setError(SYS_MESSAGES.required);
      return;
    }
    try {
      const response = await testSend.mutateAsync({ tplCd, phone: phone.trim() });
      toast.success(sentMessage(response.data));
      onClose();
    } catch (failure) {
      if (apiErrorCode(failure) === ZALO_ERRORS.invalidPhone) setError(t('messages.zalo.invalidPhone'));
      else if (isBlockedSend(failure)) alert(errorMessage(failure));
      else toast.error(errorMessage(failure));
    }
  };

  return (
    <SysFormModal
      open
      width={720}
      title={t('zalo.templates.testSend.title')}
      submitText={t('zalo.templates.testSend.button')}
      onSubmit={() => void handleSubmit()}
      submitting={testSend.isPending}
      onCancel={onClose}
      notice={t('zalo.templates.testSend.hint')}
    >
      <SysFieldGrid columns={1} labelWidth={140}>
        <SysField label={t('zalo.templates.form.tplCd')}>{tplCd}</SysField>
        <SysField label={t('zalo.common.phone')} required error={error}>
          <TextInput
            value={phone}
            maxLength={20}
            aria-label={t('zalo.common.phone')}
            placeholder={t('zalo.common.phonePlaceholder')}
            onChange={(e) => {
              setPhone(e.target.value);
              setError(undefined);
            }}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
