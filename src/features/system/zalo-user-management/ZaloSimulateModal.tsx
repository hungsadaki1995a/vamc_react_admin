import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { ZALO_ERRORS } from '@/api/system/zalo-api';
import type { ZaloSimulateResult } from '@/api/system/zalo-api';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import i18n from '@/lib/i18n';
import { errorMessage } from '@/utils/system-utils';
import { accountText } from './zalo-user-constants';
import { useSimulateZaloFollow } from './use-zalo-users';

// Zalo Users - simulated OA follow + phone share (demo mode only, hidden when the server sends for real).

type FieldKey = 'zaloNm' | 'phone';

/** Outcome of the automatic link: one match links, none or several leave the user pending. */
function resultMessage(result: ZaloSimulateResult | null | undefined): string {
  if (result?.autoLinked) return i18n.t('messages.zalo.simulatedLinked', { account: accountText(result.user) });
  if (result && result.matchCount > 1) return i18n.t('messages.zalo.simulatedMany', { count: result.matchCount });
  return i18n.t('messages.zalo.simulatedNoMatch');
}

export default function ZaloSimulateModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const simulate = useSimulateZaloFollow();
  const { errors, clearError, checkRequired, applyApiError } = useFieldErrors<FieldKey>();
  const [values, setValues] = useState({ zaloNm: '', phone: '' });

  const patch = (key: FieldKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const handleSubmit = async () => {
    if (!checkRequired(values, ['zaloNm', 'phone'])) return;
    try {
      const response = await simulate.mutateAsync({ zaloNm: values.zaloNm.trim(), phone: values.phone.trim() });
      toast.success(resultMessage(response.data));
      onClose();
    } catch (error) {
      const handled = applyApiError(error, { [ZALO_ERRORS.invalidPhone]: ['phone', t('messages.zalo.invalidPhone')] });
      if (!handled) toast.error(errorMessage(error));
    }
  };

  return (
    <SysFormModal
      open
      width={720}
      title={t('zalo.users.simulate.title')}
      submitText={t('zalo.common.run')}
      onSubmit={handleSubmit}
      submitting={simulate.isPending}
      onCancel={onClose}
      notice={t('zalo.users.simulate.notice')}
    >
      <SysFieldGrid columns={1} labelWidth={140}>
        <SysField label={t('zalo.users.simulate.zaloNm')} required error={errors.zaloNm}>
          <TextInput value={values.zaloNm} maxLength={255} onChange={(e) => patch('zaloNm', e.target.value)} />
        </SysField>
        <SysField label={t('zalo.common.phone')} required error={errors.phone}>
          <TextInput
            value={values.phone}
            maxLength={20}
            placeholder={t('zalo.common.phonePlaceholder')}
            onChange={(e) => patch('phone', e.target.value)}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
