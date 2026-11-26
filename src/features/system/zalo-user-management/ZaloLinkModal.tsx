import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppRadio from '@/components/inputs/AppRadio';
import TextInput from '@/components/inputs/TextInput';
import { useNotify } from '@/hooks/use-notify';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { ZALO_ERRORS } from '@/api/system/zalo-api';
import type { ZaloUser, ZaloUserType } from '@/api/system/zalo-api';
import { SysField, SysFieldGrid, SysFormModal } from '@/components/common/sys-ui/SysFormUi';
import { errorMessage } from '@/utils/system-utils';
import { useLinkZaloUser } from './use-zalo-users';

// Zalo Users - manual link popup (LINK_MTHD_CD MANUAL).

type FieldKey = 'userTypeCd' | 'userNo';

interface ZaloLinkModalProps {
  user: ZaloUser;
  onClose: () => void;
}

export default function ZaloLinkModal({ user, onClose }: ZaloLinkModalProps) {
  const { t } = useTranslation();
  const { toast } = useNotify();
  const link = useLinkZaloUser();
  const { errors, clearError, checkRequired, applyApiError } = useFieldErrors<FieldKey>();
  const [values, setValues] = useState<{ userTypeCd: ZaloUserType; userNo: string }>({ userTypeCd: 'MBR', userNo: '' });

  const handleSubmit = async () => {
    if (!checkRequired(values, ['userTypeCd', 'userNo'])) return;
    try {
      await link.mutateAsync({ zaloUserId: user.zaloUserId, request: { userTypeCd: values.userTypeCd, userNo: values.userNo.trim() } });
      toast.success(t('messages.zalo.linked'));
      onClose();
    } catch (error) {
      const handled = applyApiError(error, {
        [ZALO_ERRORS.accountNotFound]: ['userNo', t('messages.zalo.accountNotFound')],
        [ZALO_ERRORS.accountAlreadyLinked]: ['userNo', t('messages.zalo.accountAlreadyLinked')],
      });
      if (!handled) toast.error(errorMessage(error));
    }
  };

  return (
    <SysFormModal
      open
      width={720}
      title={t('zalo.users.link.title')}
      submitText={t('zalo.users.buttons.link')}
      onSubmit={handleSubmit}
      submitting={link.isPending}
      onCancel={onClose}
    >
      <SysFieldGrid columns={1} labelWidth={140}>
        <SysField label={t('zalo.users.link.zaloUser')}>
          <TextInput value={[user.zaloNm, user.telno].filter(Boolean).join(' · ')} disabled />
        </SysField>
        <SysField label={t('zalo.users.link.userType')} required error={errors.userTypeCd}>
          <AppRadio.Group
            value={values.userTypeCd}
            options={[
              { value: 'MBR', label: t('zalo.userTypes.MBR') },
              { value: 'EMP', label: t('zalo.userTypes.EMP') },
            ]}
            onChange={(e) => {
              setValues((prev) => ({ ...prev, userTypeCd: e.target.value as ZaloUserType }));
              clearError('userTypeCd');
            }}
          />
        </SysField>
        <SysField label={t('zalo.users.link.userNo')} required error={errors.userNo}>
          <TextInput
            value={values.userNo}
            maxLength={10}
            placeholder={t('zalo.users.link.userNoPlaceholder')}
            onChange={(e) => {
              setValues((prev) => ({ ...prev, userNo: e.target.value }));
              clearError('userNo');
            }}
          />
        </SysField>
      </SysFieldGrid>
    </SysFormModal>
  );
}
